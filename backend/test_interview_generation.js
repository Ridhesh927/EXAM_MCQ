require('dotenv').config();
const { generateJson } = require('./src/utils/aiClient');

async function testAIGeneration() {
    try {
        console.log('\n=== Testing Groq AI Generation ===\n');
        console.log('Environment check:');
        console.log('GROQ_API_KEY set:', !!process.env.GROQ_API_KEY);
        console.log('GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY);
        console.log('');
        
        const testPrompt = `
        You are an expert technical interviewer. Create 2 MCQs for the category: "DSA".
        
        Context:
        - Job Target: Software Engineer
        - Academic Year: 2024
        
        Instructions:
        1. Generate EXACTLY 2 questions.
        2. Each question must have exactly 4 options (A, B, C, D).
        3. The "correct_answer" must be the EXACT full text of one of the options.
        4. Provide a short explanation for why the correct answer is right.

        OUTPUT FORMAT - return ONLY this JSON structure:
        {
          "questions": [
            {
              "question": "...",
              "options": ["...", "...", "...", "..."],
              "correct_answer": "...",
              "explanation": "..."
            }
          ]
        }
        `;

        console.log('Sending test prompt to Groq...');
        
        const result = await generateJson({
            prompt: testPrompt,
            role: 'user',
            preferredProvider: 'groq',
            temperature: 0.35,
            maxTokens: 1000,
            groqModel: 'llama-3.3-70b-versatile',
            geminiModel: 'gemini-1.5-flash',
        });

        console.log('\n✅ SUCCESS! Generated data:');
        console.log(JSON.stringify(result.data, null, 2));
        console.log(`\nProvider used: ${result.providerUsed}`);

    } catch (error) {
        console.error('\n❌ ERROR during AI generation:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }

    process.exit(0);
}

testAIGeneration();
