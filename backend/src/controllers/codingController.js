const { pool } = require('../config/db');
const notificationController = require('./notificationController');
const logger = require('../utils/logger');
const { generateJson, generateText } = require('../utils/aiClient');

// ─────────────────────────────────────────────
// Helper: Call AI and parse JSON safely
// ─────────────────────────────────────────────
const callAI = async (prompt) => {
    const { data } = await generateJson({
        prompt,
        role: 'user',
        preferredProvider: 'auto',
        temperature: 0.7,
        groqModel: 'llama-3.3-70b-versatile',
        geminiModel: 'gemini-1.5-flash',
    });
    return data;
};

const callAIText = async (prompt) => {
    const { content } = await generateText({
        prompt,
        role: 'user',
        preferredProvider: 'auto',
        temperature: 0.2,
        groqModel: 'llama-3.3-70b-versatile',
        geminiModel: 'gemini-1.5-flash',
    });
    return content || '';
};

// ─────────────────────────────────────────────
// Execute Code via Local Machine (100% Free)
// ─────────────────────────────────────────────
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const crypto = require('crypto');

exports.executeCode = async (req, res) => {
    try {
        const { language, sourceCode, stdin = '', codingId, questionIndex } = req.body;

        const EXTENSIONS = {
            javascript: 'js',
            python: 'py',
            java: 'java',
            cpp: 'cpp',
        };

        const ext = EXTENSIONS[language];
        if (!ext) {
            return res.status(400).json({ message: 'Unsupported language' });
        }

        // Create a unique temporary file
        const fileId = crypto.randomUUID();
        // Move tempDir to the Operating System's temporary directory to avoid triggering Nodemon restarts!
        const tempDir = path.join(os.tmpdir(), 'exam_portal_exec', fileId);
        await fs.mkdir(tempDir, { recursive: true });

        let fileName = `main.${ext}`;
        if (language === 'java') {
            fileName = 'Solution.java'; // Standard name for Java templates
        }

        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, sourceCode);

        // Command mapping
        let command = '';
        if (language === 'javascript') {
            command = `node ${fileName}`;
        } else if (language === 'python') {
            command = `python ${fileName}`;
        } else if (language === 'cpp') {
            command = process.platform === 'win32' 
                ? `g++ ${fileName} -o main.exe && main.exe`
                : `g++ ${fileName} -o main && ./main`;
        } else if (language === 'java') {
            command = `javac ${fileName} && java Solution`;
        }

        // Execute code locally via Promise
        const executeLocal = () => new Promise((resolve) => {
            exec(command, { cwd: tempDir, timeout: 5000 }, async (error, stdout, stderr) => {
                try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}

                if (error) {
                    const isTimeout = error.killed;
                    resolve({
                        stdout: stdout || '',
                        stderr: isTimeout ? 'Execution Timed Out (Maximum 5 seconds)' : stderr || error.message,
                        compile_output: '',
                        status: isTimeout ? { id: 5, description: 'Time Limit Exceeded' } : { id: 4, description: 'Runtime Error' }
                    });
                } else {
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || '',
                        compile_output: '',
                        status: { id: 3, description: 'Accepted' },
                        time: '0.1',
                        memory: '1024'
                    });
                }
            });
        });

        // Concurrently run AI Testing if codingId is present
        let aiPromise = Promise.resolve('');
        if (codingId !== undefined && questionIndex !== undefined) {
            aiPromise = (async () => {
                const [rows] = await pool.query('SELECT questions FROM coding_interviews WHERE id = ?', [codingId]);
                if (rows.length > 0) {
                    const questions = typeof rows[0].questions === 'string' ? JSON.parse(rows[0].questions) : rows[0].questions;
                    const q = questions[questionIndex];
                    if (q) {
                        const prompt = `
You are a testing suite. The student just clicked 'Run Code' to test their solution.
Problem: ${q.title}
Description: ${q.description}
Examples/Tests: ${JSON.stringify(q.examples)}
Constraints: ${q.constraints}

Student's ${language} Code:
\`\`\`
${sourceCode}
\`\`\`

Evaluate ONLY if this code correctly solves the problem for all standard test cases and edge cases.
- If it is fully correct, output exactly: "✅ All Example and Hidden Test Cases Passed!"
- If it has a bug, logic flaw, or fails a case, output a concise message like: "❌ Failed: Your code fails for input X. It returns Y instead of Z." or "❌ Failed: Logic error on line 4..."
Do NOT provide the correct code. Just verify execution correctness. Keep it to 1-3 sentences max.
`;
                        return await callAIText(prompt);
                    }
                }
                return '';
            })();
        }

        const [localResult, aiFeedback] = await Promise.all([executeLocal(), aiPromise]);

        res.json({
            ...localResult,
            ai_test_feedback: aiFeedback
        });

    } catch (error) {
        logger('ERROR', 'Error executing code locally', { error: error.message });
        res.status(500).json({ message: 'Local code execution failed', error: error.message });
    }
};

// ─────────────────────────────────────────────
// 1. Generate 2-Question Coding Round
// ─────────────────────────────────────────────
exports.generateCodingRound = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { includeHard = false } = req.body;

        const levelA = includeHard ? 'Medium' : 'Easy';
        const levelB = includeHard ? 'Hard'   : 'Medium';

        const prompt = `
You are a senior software engineer setting a coding interview.
Generate 2 classic DSA problems (like LeetCode style). One should be ${levelA} difficulty, the other ${levelB} difficulty.
Focus on core DSA topics: Arrays, Strings, Hashmaps, Two Pointers, Sliding Window, Recursion, Dynamic Programming, Trees, or Graphs.
Do NOT make the problem job-role specific. These are general algorithmic problems.

Return ONLY a JSON object with this exact structure:
{
  "questions": [
    {
      "title": "Problem title here",
      "difficulty": "${levelA}",
      "description": "Full problem statement, clear and unambiguous.",
      "examples": [
        { "input": "nums = [1,2,3]", "output": "6", "explanation": "Sum of all elements" }
      ],
      "constraints": "1 <= nums.length <= 10^5\\n-10^9 <= nums[i] <= 10^9",
      "hint": "Think about using a hashmap for O(n) solution."
    },
    {
      "title": "Problem title here",
      "difficulty": "${levelB}",
      "description": "Full problem statement.",
      "examples": [
        { "input": "s = 'abcabcbb'", "output": "3", "explanation": "The answer is 'abc'" }
      ],
      "constraints": "0 <= s.length <= 5 * 10^4",
      "hint": "Consider using sliding window technique."
    }
  ]
}
`;

        logger('INFO', `Generating coding round for student ${studentId}`, { includeHard });
        const parsed = await callAI(prompt);

        if (!parsed.questions || parsed.questions.length < 2) {
            throw new Error('AI returned invalid question format. Try again.');
        }

        const [result] = await pool.query(
            'INSERT INTO coding_interviews (student_id, include_hard, questions) VALUES (?, ?, ?)',
            [studentId, includeHard, JSON.stringify(parsed.questions)]
        );

        logger('INFO', `Coding round created for student ${studentId}`, { id: result.insertId });
        res.status(201).json({ codingId: result.insertId });

    } catch (error) {
        logger('ERROR', 'Error generating coding round', { error: error.message });
        res.status(500).json({ message: 'Failed to generate coding round.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// 2. Get Coding Round by ID
// ─────────────────────────────────────────────
exports.getCodingRound = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;

        const [rows] = await pool.query(
            'SELECT * FROM coding_interviews WHERE id = ? AND student_id = ?',
            [id, studentId]
        );

        if (!rows.length) return res.status(404).json({ message: 'Coding round not found.' });

        const [parentInterview] = await pool.query(
            'SELECT id FROM interviews WHERE coding_id = ? AND student_id = ?',
            [id, studentId]
        );
        const parentInterviewId = parentInterview[0]?.id || null;

        const round = rows[0];
        // Handle mysql2 auto-parsing
        const questions = typeof round.questions === 'string' ? JSON.parse(round.questions) : round.questions;
        const studentCodes = round.student_codes
            ? (typeof round.student_codes === 'string' ? JSON.parse(round.student_codes) : round.student_codes)
            : { q1: '', q2: '' };

        res.status(200).json({ round: { ...round, questions, student_codes: studentCodes, parent_interview_id: parentInterviewId } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// 3. Submit Code for AI Grading
// ─────────────────────────────────────────────
exports.submitCodingRound = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const { q1Code, q2Code, language = 'javascript' } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM coding_interviews WHERE id = ? AND student_id = ?',
            [id, studentId]
        );
        if (!rows.length) return res.status(403).json({ message: 'Unauthorized or not found.' });

        const round = rows[0];
        const questions = typeof round.questions === 'string' ? JSON.parse(round.questions) : round.questions;
        const q1 = questions[0];
        const q2 = questions[1];

        const prompt = `
You are a senior algorithmic interviewer. A student just submitted code for 2 DSA problems.
Evaluate both solutions as a professional code reviewer. Be honest, constructive, and specific.

---
PROBLEM 1 (${q1.difficulty}): ${q1.title}
${q1.description}

Student's ${language} code:
\`\`\`${language}
${q1Code || '// No code submitted'}
\`\`\`

---
PROBLEM 2 (${q2.difficulty}): ${q2.title}
${q2.description}

Student's ${language} code:
\`\`\`${language}
${q2Code || '// No code submitted'}
\`\`\`

---
Return ONLY a JSON object:
{
  "total_score": <integer 0-100 overall>,
  "q1_score": <integer 0-50>,
  "q1_feedback": "Detailed review of Q1 code: correctness, edge cases, time complexity, improvements.",
  "q2_score": <integer 0-50>,
  "q2_feedback": "Detailed review of Q2 code: correctness, edge cases, time complexity, improvements.",
  "overall_feedback": "2-3 sentences summarizing the candidate's algorithmic thinking and what to study."
}
`;

        logger('INFO', `Grading coding round ${id} for student ${studentId}`);
        const grading = await callAI(prompt);

        const studentCodes = { q1: q1Code || '', q2: q2Code || '' };
        const score = Math.min(100, Math.max(0, grading.total_score || 0));

        const feedbackText = [
            `=== Question 1: ${q1.title} (${grading.q1_score ?? '?'}/50) ===`,
            grading.q1_feedback || '',
            '',
            `=== Question 2: ${q2.title} (${grading.q2_score ?? '?'}/50) ===`,
            grading.q2_feedback || '',
            '',
            `=== Overall ===`,
            grading.overall_feedback || ''
        ].join('\n');

        await pool.query(
            'UPDATE coding_interviews SET student_codes = ?, language = ?, total_score = ?, ai_feedback = ? WHERE id = ?',
            [JSON.stringify(studentCodes), language, score, feedbackText, id]
        );

        logger('INFO', `Coding round ${id} graded`, { score });

        // Trigger Notification
        notificationController.createNotification(
            studentId,
            'student',
            'Coding Round Graded',
            `Your AI coding round evaluation is complete. Total Score: ${score}/100.`,
            `/student/results`
        );

        res.status(200).json({ score, feedback: feedbackText });

    } catch (error) {
        logger('ERROR', 'Error grading coding round', { error: error.message });
        res.status(500).json({ message: 'Failed to grade submission.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// 4. Get Coding History
// ─────────────────────────────────────────────
exports.getCodingHistory = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [rows] = await pool.query(
            'SELECT id, include_hard, total_score, ai_feedback, language, created_at FROM coding_interviews WHERE student_id = ? ORDER BY created_at DESC',
            [studentId]
        );
        res.status(200).json({ history: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
