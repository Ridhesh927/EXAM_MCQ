const { pool } = require('../config/db');

// Create Exam
exports.createExam = async (req, res) => {
    try {
        const { title, subject, duration, total_marks, passing_marks, instructions, questions } = req.body;
        const teacher_id = req.user.id;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [examResult] = await connection.query(
                'INSERT INTO exams (title, subject, duration, total_marks, passing_marks, instructions, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, subject, duration, total_marks, passing_marks, instructions, teacher_id]
            );

            const examId = examResult.insertId;

            if (questions && questions.length > 0) {
                const questionValues = questions.map(q => [
                    examId, q.question, JSON.stringify(q.options), q.correct_answer, q.marks, q.difficulty
                ]);
                await connection.query(
                    'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty) VALUES ?',
                    [questionValues]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Exam created successfully', examId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Exams (for Teacher)
exports.getTeacherExams = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM exams WHERE teacher_id = ?', [req.user.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Exam Details (for Student)
exports.getExamDetails = async (req, res) => {
    try {
        const [exam] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (exam.length === 0) return res.status(404).json({ message: 'Exam not found' });

        const [questions] = await pool.query('SELECT id, question, options, marks, difficulty FROM exam_questions WHERE exam_id = ?', [req.params.id]);

        res.json({ ...exam[0], questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit Exam
exports.submitExam = async (req, res) => {
    try {
        const { examId, answers, completionTime } = req.body;
        const studentId = req.user.id;

        const [questions] = await pool.query('SELECT id, correct_answer, marks FROM exam_questions WHERE exam_id = ?', [examId]);

        let score = 0;
        let correctCount = 0;

        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                score += q.marks;
                correctCount++;
            }
        });

        const [result] = await pool.query(
            'INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_answers, completion_time) VALUES (?, ?, ?, ?, ?, ?)',
            [examId, studentId, score, questions.length, correctCount, completionTime]
        );

        res.json({ message: 'Exam submitted successfully', score, resultId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
