const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger.js');
const { matchSection, getSamplesBySection } = require('../utils/csvSearch.js');
const { generateJson } = require('../utils/aiClient.js');
require('dotenv').config();

const MIN_PDF_TEXT_LENGTH = 120;

const extractScannedPdfTextWithGemini = async (pdfBuffer) => {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.KILO_API_KEY;
    if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY or KILO_API_KEY is not configured');
    }

    const geminiClient = new GoogleGenerativeAI(geminiApiKey);
    const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: 'Extract all readable text from this scanned PDF. Return only plain text with paragraph breaks, no markdown and no additional commentary.'
                    },
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: pdfBuffer.toString('base64')
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
        }
    });

    return result?.response?.text()?.trim() || '';
};

exports.generateQuestions = async (req, res) => {
    try {
        let { context, count = 5, difficulty = 'Medium', category = '', provider = 'auto' } = req.body;
        let fileContent = '';
        let extractionMethod = null;

        // Handle File Upload Extraction
        if (req.file) {
            const mimetype = req.file.mimetype;
            const buffer = req.file.buffer;

            if (mimetype === 'application/pdf') {
                const pdfData = await pdf(buffer);
                fileContent = (pdfData.text || '').trim();
                extractionMethod = 'pdf-parse';

                // Fallback for scanned PDFs where embedded text is missing/very small.
                if (fileContent.length < MIN_PDF_TEXT_LENGTH) {
                    try {
                        const scannedText = await extractScannedPdfTextWithGemini(buffer);
                        if (scannedText.length >= MIN_PDF_TEXT_LENGTH) {
                            fileContent = scannedText;
                            extractionMethod = 'gemini-scanned-pdf-ocr';
                        }
                    } catch (ocrError) {
                        logger('WARN', 'Scanned PDF OCR fallback failed', { message: ocrError.message });
                    }
                }

                logger('INFO', 'Extracted text from PDF', {
                    length: fileContent.length,
                    extractionMethod
                });
            } else if (mimetype.startsWith('image/')) {
                const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
                fileContent = text;
                extractionMethod = 'tesseract-image-ocr';
                logger('INFO', 'Extracted text from image (OCR)', { length: fileContent.length, extractionMethod });
            }
        }

        // Combine context from body and file
        const finalContext = (context || '') + '\n' + fileContent;

        if (!finalContext.trim() && !category.trim()) {
            return res.status(400).json({ message: 'Syllabus text, a file (PDF/Image), or a category is required to generate questions.' });
        }

        // Limit count to prevent abuse or timeout
        const questionCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);

        // ── CSV Reference Integration ──────────────────────────────────────────
        let referenceBlock = '';
        let matchedSection = null;

        if (category && category.trim()) {
            matchedSection = matchSection(category.trim());

            if (matchedSection) {
                const samples = getSamplesBySection(matchedSection, 5);

                if (samples.length > 0) {
                    const sampleText = samples.map((s, i) =>
                        `  Example ${i + 1}:\n  Q: ${s.question}\n  A) ${s.a}  B) ${s.b}  C) ${s.c}  D) ${s.d}\n  Correct Answer: ${s.answer}`
                    ).join('\n\n');

                    referenceBlock = `
Reference Examples from the "${matchedSection}" question bank (use these to match the style and difficulty):
"""
${sampleText}
"""
`;
                    logger('INFO', `CSV reference injected for section: ${matchedSection}`, { samplesCount: samples.length });
                } else {
                    logger('INFO', `No CSV samples found for matched section "${matchedSection}". Falling back to AI-only generation.`);
                }
            } else {
                logger('INFO', `No matching section in CSV for category "${category}". Falling back to AI-only generation.`);
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        // Build Prompt — Reference section is injected only if samples were found
        const contextSection = finalContext.trim()
            ? `Context/Dataset:\n"""\n${finalContext}\n"""\n`
            : `Topic: ${category}\n`;

        const referenceInstruction = referenceBlock
            ? `${referenceBlock}\nUsing the reference examples above to guide the style and format, `
            : '';

        const prompt = `You are an expert curriculum designer and exam question creator.
${contextSection}
${referenceInstruction}generate exactly ${questionCount} multiple-choice questions (MCQs) at a ${difficulty} difficulty level.

Instructions:
1. Generate exactly ${questionCount} questions.
2. Each question must have exactly 4 options (A, B, C, D).
3. Specify the correct answer precisely as the EXACT text of the correct option (not just the letter A, B, C, or D).
4. Provide a very short explanation for why the answer is correct.
5. All output must be valid JSON in the exact structure described below.
6. Make sure the correct answer is NOT always the first option — vary its position.

OUTPUT FORMAT MUST BE A STRICT JSON OBJECT containing an array named "questions":
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "explanation": "Paris is the capital of France."
    }
  ]
}`;

        const { data: parsedData, providerUsed } = await generateJson({
            prompt,
            role: 'system',
            preferredProvider: provider,
            temperature: 0.7,
            groqModel: 'llama-3.1-8b-instant',
            geminiModel: 'gemini-1.5-flash',
        });

        if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid JSON structure returned from AI');
        }

        res.status(200).json({
            questions: parsedData.questions,
            meta: {
                providerUsed,
                matchedSection,       // null if no CSV match (fallback used)
                referenceUsed: !!referenceBlock,
                extractionMethod,
            }
        });

    } catch (error) {
        logger('ERROR', 'Error in AI question generation:', { message: error.message, error: error });
        res.status(500).json({ message: 'Failed to generate questions using AI.', error: error.message });
    }
};
