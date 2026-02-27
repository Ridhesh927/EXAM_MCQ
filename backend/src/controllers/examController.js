const { pool } = require('../config/db');
const xlsx = require('xlsx');
const logger = require('../utils/logger');

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

            logger('CREATE_EXAM', `Teacher ID ${teacher_id} created exam: ${title}`, { examId, subject });

            res.status(201).json({ message: 'Exam created successfully', examId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        logger('CREATE_EXAM_ERROR', `Error creating exam`, { error: error.message });
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
        const [rows] = await pool.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Exam not found' });

        const exam = rows[0];

        // Security Checks
        if (exam.status !== 'Published') {
            return res.status(403).json({ message: 'Exam is not yet published' });
        }

        if (exam.scheduled_start) {
            const now = new Date();
            const start = new Date(exam.scheduled_start);
            if (now < start) {
                return res.status(403).json({ message: `Exam is scheduled to start at ${exam.scheduled_start}` });
            }
        }

        const [questions] = await pool.query('SELECT id, question, options, marks, difficulty FROM exam_questions WHERE exam_id = ?', [req.params.id]);

        res.json({ ...exam, questions });
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

        // Mark session as completed
        await pool.query(
            'UPDATE exam_sessions SET status = "completed", end_time = CURRENT_TIMESTAMP WHERE student_id = ? AND exam_id = ? AND status = "active"',
            [studentId, examId]
        );

        logger('SUBMIT_EXAM', `Student ID ${studentId} submitted exam ID ${examId}`, { score, resultId: result.insertId });

        res.json({ message: 'Exam submitted successfully', score, resultId: result.insertId });
    } catch (error) {
        logger('SUBMIT_EXAM_ERROR', `Error submitting exam ID ${req.body.examId}`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Start Exam Session
exports.startExamSession = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user.id;

        // Check for existing active session
        const [active] = await pool.query(
            'SELECT * FROM exam_sessions WHERE student_id = ? AND exam_id = ? AND status = "active"',
            [studentId, examId]
        );

        if (active.length > 0) {
            return res.json({ message: 'Session already active', sessionId: active[0].id });
        }

        const [result] = await pool.query(
            'INSERT INTO exam_sessions (student_id, exam_id) VALUES (?, ?)',
            [studentId, examId]
        );

        logger('START_EXAM_SESSION', `Student ID ${studentId} started exam ID ${examId}`, { sessionId: result.insertId });

        res.status(201).json({ message: 'Session started', sessionId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Log Warning
exports.logWarning = async (req, res) => {
    try {
        const { sessionId, warningType, message } = req.body;

        await pool.query(
            'INSERT INTO exam_warnings (session_id, warning_type, message) VALUES (?, ?, ?)',
            [sessionId, warningType, message]
        );

        await pool.query(
            'UPDATE exam_sessions SET warnings_count = warnings_count + 1 WHERE id = ?',
            [sessionId]
        );

        res.json({ message: 'Warning logged' });

        // Emit real-time warning to teacher
        const io = req.app.get('socketio');
        if (io) {
            const [session] = await pool.query('SELECT exam_id FROM exam_sessions WHERE id = ?', [sessionId]);
            if (session.length > 0) {
                io.to(`exam-${session[0].exam_id}`).emit('student-warning-alert', {
                    userId: req.user.id,
                    sessionId,
                    warningType,
                    message
                });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Student Response
exports.updateResponse = async (req, res) => {
    try {
        const { sessionId, questionId, selectedOption, timeSpent } = req.body;

        // Upsert response
        const [existing] = await pool.query(
            'SELECT * FROM student_responses WHERE session_id = ? AND question_id = ?',
            [sessionId, questionId]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE student_responses SET selected_option = ?, time_spent = time_spent + ? WHERE id = ?',
                [selectedOption, timeSpent, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO student_responses (session_id, question_id, selected_option, time_spent) VALUES (?, ?, ?, ?)',
                [sessionId, questionId, selectedOption, timeSpent]
            );
        }

        res.json({ message: 'Response updated' });

        // Emit real-time update to teacher
        const io = req.app.get('socketio');
        if (io) {
            const [session] = await pool.query('SELECT exam_id FROM exam_sessions WHERE id = ?', [sessionId]);
            if (session.length > 0) {
                io.to(`exam-${session[0].exam_id}`).emit('student-progress-update', {
                    sessionId,
                    questionId,
                    selectedOption,
                    timeSpent,
                    studentId: req.user.id
                });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Active Sessions for an Exam (for Proctoring)
exports.getActiveSessions = async (req, res) => {
    try {
        const { examId } = req.params;
        const [rows] = await pool.query(`
            SELECT es.*, s.username as student_name, s.prn_number,
            (SELECT COUNT(*) FROM exam_warnings WHERE session_id = es.id) as warnings_count
            FROM exam_sessions es 
            JOIN students s ON es.student_id = s.id 
            WHERE es.exam_id = ? AND es.status = 'active'
        `, [examId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Dashboard Stats (for Teacher)
exports.getDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [examCount] = await pool.query('SELECT COUNT(*) as total FROM exams WHERE teacher_id = ?', [teacherId]);
        const [activeSessions] = await pool.query(
            'SELECT COUNT(*) as total FROM exam_sessions es JOIN exams e ON es.exam_id = e.id WHERE e.teacher_id = ? AND es.status = "active"',
            [teacherId]
        );
        const [recentResults] = await pool.query(
            'SELECT er.*, s.username as student_name, e.title as exam_title FROM exam_results er JOIN students s ON er.student_id = s.id JOIN exams e ON er.exam_id = e.id WHERE e.teacher_id = ? ORDER BY er.submitted_at DESC LIMIT 5',
            [teacherId]
        );

        res.json({
            totalExams: examCount[0].total,
            activeSessions: activeSessions[0].total,
            recentResults
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk Upload Questions
exports.uploadBulkQuestions = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const { examId } = req.body;

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const questions = data.map(row => ({
            question: row.question,
            options: [row.option1, row.option2, row.option3, row.option4],
            correct_answer: parseInt(row.correct_answer) - 1, // assuming 1-based in excel
            marks: row.marks || 1,
            difficulty: row.difficulty || 'Medium'
        }));

        if (examId) {
            const questionValues = questions.map(q => [
                examId, q.question, JSON.stringify(q.options), q.correct_answer, q.marks, q.difficulty
            ]);
            await pool.query(
                'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty) VALUES ?',
                [questionValues]
            );
            return res.json({ message: 'Questions uploaded and saved successfully', count: questions.length });
        }

        res.json({ message: 'Questions parsed successfully', questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Results for Teacher
exports.getTeacherResults = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [results] = await pool.query(`
            SELECT 
                er.id,
                er.score,
                er.total_questions,
                er.correct_answers,
                er.submitted_at,
                s.username as student_name,
                s.email as student_email,
                e.title as exam_title,
                e.total_marks
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN students s ON er.student_id = s.id
            WHERE e.teacher_id = ?
            ORDER BY er.submitted_at DESC
        `, [teacherId]);

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
