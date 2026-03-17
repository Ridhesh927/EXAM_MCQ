const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger.js');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.generateQuestions = async (req, res) => {
    try {
        let { context, count = 5, difficulty = 'Medium' } = req.body;
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

        if (!finalContext || finalContext.trim() === '') {
            return res.status(400).json({ message: 'Syllabus text or a file (PDF/Image) is required to generate questions.' });
        }

        // Limit count to prevent abuse or timeout
        const questionCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);

        const prompt = `You are an expert curriculum designer and exam question creator.
Based ONLY on the following dataset/context, generate exactly ${questionCount} multiple-choice questions (MCQs) at a ${difficulty} difficulty level.

Context/Dataset:
"""
${finalContext}
"""

Instructions:
1. Generate exactly ${questionCount} questions.
2. Each question must have exactly 4 options (A, B, C, D).
3. Specify the correct answer precisely as the EXACT text of the correct option (not just the letter A, B, C, or D).
4. Provide a very short explanation for why the answer is correct based on the text.
5. All output must be valid JSON in the exact structure described below.

OUTPUT FORMAT MUST BE A STRICT JSON OBJECT containing an array named "questions":
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "explanation": "Paris is clearly stated as the capital of France in the text."
    }
  ]
}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'llama-3.1-8b-instant', // Up-to-date replacement for decommissioned Llama 3 8B
            temperature: 0.5,
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

        res.status(200).json({ questions: parsedData.questions });

    } catch (error) {
        logger('ERROR', 'Error in Groq AI generation:', { message: error.message, error: error });
        res.status(500).json({ message: 'Failed to generate questions using AI.', error: error.message });
    }
};
