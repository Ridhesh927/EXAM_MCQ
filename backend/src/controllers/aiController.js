const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger.js');
const { matchSection, getSamplesBySection } = require('../utils/csvSearch.js');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.generateQuestions = async (req, res) => {
    try {
        let { context, count = 5, difficulty = 'Medium', category = '' } = req.body;
        let fileContent = '';

        // Handle File Upload Extraction
        if (req.file) {
            const mimetype = req.file.mimetype;
            const buffer = req.file.buffer;

            if (mimetype === 'application/pdf') {
                const pdfData = await pdf(buffer);
                fileContent = pdfData.text;
                logger('INFO', 'Extracted text from PDF', { length: fileContent.length });
            } else if (mimetype.startsWith('image/')) {
                const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
                fileContent = text;
                logger('INFO', 'Extracted text from image (OCR)', { length: fileContent.length });
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

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const jsonResponse = chatCompletion.choices[0]?.message?.content;

        if (!jsonResponse) {
            throw new Error('No response from AI');
        }

        const parsedData = JSON.parse(jsonResponse);

        if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid JSON structure returned from AI');
        }

        res.status(200).json({
            questions: parsedData.questions,
            meta: {
                matchedSection,       // null if no CSV match (fallback used)
                referenceUsed: !!referenceBlock,
            }
        });

    } catch (error) {
        logger('ERROR', 'Error in Groq AI generation:', { message: error.message, error: error });
        res.status(500).json({ message: 'Failed to generate questions using AI.', error: error.message });
    }
};
