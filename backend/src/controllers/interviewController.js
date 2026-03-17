const { pool } = require('../config/db');
const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Reference Datasets for AI Context
// In a production system, these might be stored in the DB, but for now
// we keep them as static prompts to guide the AI's difficulty and style.
const REFERENCE_DATASETS = {
    aptitude: `
    Examples of Aptitude Questions (Difficulty varies):
    1. A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?
    2. The price of a commodity is increased by 25%. By what percentage must a consumer reduce their consumption so that the expenditure remains the same?
    3. If A can do a piece of work in 10 days and B can do it in 15 days, how long will they take if they work together?
    Focus on quantitative analysis, time/distance, percentages, and basic algebra.
    `,
    logical: `
    Examples of Logical Reasoning Questions:
    1. Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?
    2. Pointing to a photograph, a man said, "I have no brother or sister but that man's father is my father's son." Whose photograph was it?
    3. In a certain code language, '134' means 'good and tasty', '478' means 'see good pictures'. Which digit stands for 'see'?
    Focus on pattern recognition, syllogisms, blood relations, and coding/decoding.
    `,
    coding: `
    Examples of Coding/Technical Questions (Varies by role):
    - Frontend: Explain the Virtual DOM. How does React handle state updates under the hood?
    - Backend: What is the difference between SQL and NoSQL databases? Explain ACID properties.
    - Full Stack: How would you design a scalable REST API? Explain JWT authentication flow.
    - General coding: Write a function to reverse a linked list. What is the time complexity of QuickSort?
    Focus on technical concepts, system design, and algorithms relevant to the provided CV and role.
    `
};

// 1. Upload and Parse Resume
exports.uploadResume = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded.' });
        }

        const mimetype = req.file.mimetype;
        const buffer = req.file.buffer;
        let resumeText = '';

        logger('INFO', `Parsing resume for student ${studentId}`, { mimetype });

        if (mimetype === 'application/pdf') {
            const pdfData = await pdf(buffer);
            resumeText = pdfData.text;
        } else if (mimetype.startsWith('image/')) {
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
            resumeText = text;
        } else {
            return res.status(400).json({ message: 'Invalid file type. Please upload a PDF or an Image.' });
        }

        if (!resumeText || resumeText.trim() === '') {
             return res.status(400).json({ message: 'Could not extract text from the uploaded file.' });
        }

        // Optional: Use AI to quickly summarize structured skills from the raw text
        const summarizePrompt = `
        Extract a brief structured summary of the core technical skills, programming languages, and frameworks from the following resume text. 
        Format the output strictly as a JSON array of strings. e.g. ["React", "Node.js", "Python", "SQL"].
        
        Resume Text:
        """
        ${resumeText.substring(0, 4000)} // Limit length for speed
        """
        `;

        let parsedSkills = [];
        try {
             const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: summarizePrompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const AIResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
            
            // Handle different possible JSON shapes the AI might return
            if (Array.isArray(AIResponse)) {
                parsedSkills = AIResponse;
            } else if (AIResponse.skills && Array.isArray(AIResponse.skills)) {
                parsedSkills = AIResponse.skills;
            } else {
                // fallback extraction
                parsedSkills = Object.values(AIResponse).flat().filter(i => typeof i === 'string');
            }
        } catch (aiErr) {
            logger('WARN', 'AI failed to summarize skills, saving raw text only', { error: aiErr.message });
        }

        // Save to Database
        await pool.query(
            'UPDATE students SET resume_text = ?, parsed_skills = ? WHERE id = ?',
            [resumeText, JSON.stringify(parsedSkills), studentId]
        );

        res.status(200).json({ 
            message: 'Resume parsed and saved successfully.', 
            skills: parsedSkills 
        });

    } catch (error) {
        logger('ERROR', 'Error processing resume', { error: error.message });
        res.status(500).json({ message: 'Failed to process resume.', error: error.message });
    }
};

// 2. Generate Personalized Interview
exports.generateInterview = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { jobRoleTarget } = req.body;

        if (!jobRoleTarget) {
            return res.status(400).json({ message: 'Job role target is required.' });
        }

        // Fetch Student Data (Resume, Year)
        const [studentData] = await pool.query(
            'SELECT resume_text, year FROM students WHERE id = ?',
            [studentId]
        );

        if (!studentData || studentData.length === 0 || !studentData[0].resume_text) {
            return res.status(400).json({ message: 'No resume found. Please upload a resume first.' });
        }

        const resume = studentData[0].resume_text;
        const studentYear = studentData[0].year || 'Unknown';

        // Fetch past performance (Optional advanced logic: average score across past exams)
        const [results] = await pool.query('SELECT AVG((score/total_marks)*100) as avg_score FROM exam_results WHERE student_id = ?', [studentId]);
        const avgScore = results[0]?.avg_score || 0;
        let performanceLevel = 'Average';
        if (avgScore > 80) performanceLevel = 'Advanced';
        else if (avgScore < 50) performanceLevel = 'Beginner';

        logger('INFO', `Generating interview for student ${studentId}`, { role: jobRoleTarget, year: studentYear, perf: performanceLevel });

        const prompt = `
        You are an expert technical interviewer and recruiter.
        Create a personalized 15-question Multiple Choice Question (MCQ) interview for a candidate applying for the role of "${jobRoleTarget}".

        Candidate Context:
        - Job Target: ${jobRoleTarget}
        - Academic Year: ${studentYear}
        - Estimated Baseline Skill Level: ${performanceLevel}
        
        Candidate Resume:
        """
        ${resume.substring(0, 3000)}
        """

        Reference Datasets to guide difficulty and style:
        ${REFERENCE_DATASETS.aptitude}
        ${REFERENCE_DATASETS.logical}
        ${REFERENCE_DATASETS.coding}

        Instructions:
        1. Generate exactly 15 MCQs.
        2. Distribution: 5 Aptitude, 5 Logical Reasoning, 5 Technical/Coding.
        3. The Technical/Coding questions MUST be heavily tailored to the skills, languages, and frameworks mentioned in the candidate's resume and relevant to the "${jobRoleTarget}" role.
        4. Each question must have exactly 4 options.
        5. Provide the correct answer exactly as it appears in the options.
        6. Provide a short explanation.

        OUTPUT FORMAT MUST BE A STRICT JSON OBJECT containing an array named "questions":
        {
          "questions": [
            {
              "question": "If x=5, what is...",
              "options": ["A", "B", "C", "D"],
              "correct_answer": "B",
              "explanation": "Because..."
            }
          ]
        }
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.6,
            response_format: { type: 'json_object' }
        });

        const jsonResponse = chatCompletion.choices[0]?.message?.content;
        
        if (!jsonResponse) throw new Error('No response from AI');

        const parsedData = JSON.parse(jsonResponse);
        if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid JSON structure returned from AI');
        }

        // Save generated interview to DB
        const [interviewResult] = await pool.query(
            'INSERT INTO interviews (student_id, job_role_target) VALUES (?, ?)',
            [studentId, jobRoleTarget]
        );
        const interviewId = interviewResult.insertId;

        const questionValues = parsedData.questions.map(q => [
            interviewId,
            q.question,
            JSON.stringify(q.options),
            q.correct_answer,
            q.explanation
        ]);

        await pool.query(
            'INSERT INTO interview_questions (interview_id, question, options, correct_answer, explanation) VALUES ?',
            [questionValues]
        );

        res.status(200).json({ 
            message: 'Interview generated successfully.',
            interviewId: interviewId,
            questionCount: parsedData.questions.length
        });

    } catch (error) {
        logger('ERROR', 'Error generating interview', { error: error.message });
        res.status(500).json({ message: 'Failed to generate interview.', error: error.message });
    }
};

// 3. Get Student's Interviews
exports.getInterviews = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [interviews] = await pool.query(
            'SELECT * FROM interviews WHERE student_id = ? ORDER BY created_at DESC',
            [studentId]
        );
        
        // Include resume status
        const [student] = await pool.query('SELECT parsed_skills FROM students WHERE id = ?', [studentId]);
        const hasResume = !!student[0]?.parsed_skills;
        const parsedSkills = student[0]?.parsed_skills ? JSON.parse(student[0].parsed_skills) : [];

        res.status(200).json({ interviews, hasResume, parsedSkills });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Get Specific Interview Questions
exports.getInterviewDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // Verify ownership
        const [interview] = await pool.query('SELECT * FROM interviews WHERE id = ? AND student_id = ?', [id, studentId]);
        if (interview.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or interview not found.' });
        }

        const [questions] = await pool.query('SELECT id, question, options FROM interview_questions WHERE interview_id = ?', [id]);
        
        // Parse options back to arrays
        const formattedQuestions = questions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));

        res.status(200).json({ interview: interview[0], questions: formattedQuestions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Submit Interview and Get Feedback
exports.submitInterview = async (req, res) => {
    try {
        const { id } = req.params; // interview id
        const studentId = req.user.id;
        const { answers } = req.body; // Object: { questionId: selectedOptionText }

        // Verify ownership
        const [interview] = await pool.query('SELECT * FROM interviews WHERE id = ? AND student_id = ?', [id, studentId]);
        if (interview.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or interview not found.' });
        }

        // Get questions
        const [questions] = await pool.query('SELECT * FROM interview_questions WHERE interview_id = ?', [id]);
        
        let correctCount = 0;
        let aiFeedbackContext = '';

        for (const q of questions) {
            const studentAnswer = answers[q.id];
            let isCorrect = false;
            
            if (studentAnswer && studentAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
                correctCount++;
                isCorrect = true;
            }

            // Save student's answer
            await pool.query('UPDATE interview_questions SET student_answer = ? WHERE id = ?', [studentAnswer || null, q.id]);

            aiFeedbackContext += `
            Question: ${q.question}
            Student Answer: ${studentAnswer || "No Answer"}
            Correct Answer: ${q.correct_answer}
            Was Correct: ${isCorrect}
            `;
        }

        const scorePercentage = Math.round((correctCount / questions.length) * 100);

        // Generate AI Feedback based on performance
        const prompt = `
        You are an expert technical interviewer. The candidate just finished an MCQ screening test for the role of "${interview[0].job_role_target}".
        They scored ${scorePercentage}% (${correctCount} out of ${questions.length}).

        Here is the breakdown of their answers:
        ${aiFeedbackContext}

        Provide a very brief (2-3 paragraphs max) constructive feedback report.
        Highlight their strong areas, point out what they need to study more, and give specific advice for their upcoming real interviews.
        Be encouraging but realistic. Do not use markdown styling like headers, just plain text paragraphs.
        `;

        let feedbackText = "Feedback generation failed.";
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'system', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
            });
            feedbackText = chatCompletion.choices[0]?.message?.content || "No feedback generated.";
        } catch (aiErr) {
            logger('WARN', 'AI feedback generation failed', { error: aiErr.message });
        }

        // Update overall interview score and feedback
        await pool.query('UPDATE interviews SET total_score = ?, ai_feedback = ? WHERE id = ?', [scorePercentage, feedbackText, id]);

        res.status(200).json({
            message: 'Interview submitted successfully.',
            score: scorePercentage,
            feedback: feedbackText
        });

    } catch (error) {
         logger('ERROR', 'Error submitting interview', { error: error.message });
         res.status(500).json({ error: error.message });
    }
};
