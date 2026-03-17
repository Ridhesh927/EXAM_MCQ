const { pool } = require('../config/db');
const xlsx = require('xlsx');
const logger = require('../utils/logger');

// Create Exam
exports.createExam = async (req, res) => {
    try {
        const { title, subject, duration, total_marks, passing_marks, instructions, questions, target_department, target_year, status, scheduled_start } = req.body;
        const teacher_id = req.user.id;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Calculate total marks from questions if provided, otherwise use total_marks from body
            let finalTotalMarks = total_marks;
            if (questions && questions.length > 0) {
                finalTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 5), 0);
            }

            const [examResult] = await connection.query(
                'INSERT INTO exams (title, subject, duration, total_marks, passing_marks, instructions, teacher_id, target_department, target_year, status, scheduled_start) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, subject, duration, finalTotalMarks, passing_marks, instructions, teacher_id, target_department || null, target_year || null, status || 'Published', scheduled_start || null]
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

// Get All Exams (for any Teacher - shared view)
exports.getTeacherExams = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.*, t.username as created_by
             FROM exams e
             LEFT JOIN teachers t ON e.teacher_id = t.id
             ORDER BY e.created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Exam (any teacher can delete any exam)
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM exams WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        logger('DELETE_EXAM', `Exam ID ${id} deleted by teacher ID ${req.user.id}`);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Exam Details (For Teacher Edit Page - no restrictions)
exports.getTeacherExamDetails = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM exams WHERE id = ? AND teacher_id = ?', [req.params.id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Exam not found or unauthorized' });

        const exam = rows[0];
        const [questions] = await pool.query('SELECT id, question, options, correct_answer as correct, marks, difficulty FROM exam_questions WHERE exam_id = ?', [req.params.id]);

        // Parse options back to arrays for frontend
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));

        res.json({ ...exam, questions: parsedQuestions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Exam
exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subject, duration, passing_marks, target_department, target_year, status, questions } = req.body;
        const teacher_id = req.user.id;

        // Verify ownership
        const [authCheck] = await pool.query('SELECT id FROM exams WHERE id = ? AND teacher_id = ?', [id, teacher_id]);
        if (authCheck.length === 0) return res.status(403).json({ message: 'Unauthorized or exam not found' });

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks !== undefined ? q.marks : 5), 0);

            await connection.query(
                'UPDATE exams SET title=?, subject=?, duration=?, total_marks=?, passing_marks=?, target_department=?, target_year=?, status=? WHERE id=?',
                [title, subject, duration, calculatedTotalMarks, passing_marks, target_department || null, target_year || null, status || 'Draft', id]
            );

            // For simplicity: clear student_responses first to avoid foreign key errors, then delete old questions and insert new ones
            await connection.query(
                'DELETE FROM student_responses WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id = ?)',
                [id]
            );

            await connection.query('DELETE FROM exam_questions WHERE exam_id = ?', [id]);

            if (questions && questions.length > 0) {
                const questionValues = questions.map(q => {
                    const questionText = q.question || q.text;
                    const optionsString = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);
                    const correctAnswer = q.correct_answer !== undefined ? q.correct_answer : (q.correct !== undefined ? q.correct : 0);
                    const marks = q.marks !== undefined ? q.marks : 5;
                    const difficulty = q.difficulty || 'medium';
                    return [id, questionText, optionsString, correctAnswer, marks, difficulty];
                });
                await connection.query(
                    'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty) VALUES ?',
                    [questionValues]
                );
            }

            await connection.commit();
            logger('UPDATE_EXAM', `Teacher ID ${teacher_id} updated exam: ${title}`, { examId: id });
            res.json({ message: 'Exam updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        logger('UPDATE_EXAM_ERROR', `Error updating exam`, { error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Schedule Exam
exports.scheduleExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_start } = req.body;

        let status = 'Published';
        if (scheduled_start) {
            const start = new Date(scheduled_start);
            if (start > new Date()) {
                status = 'Scheduled';
            }
        }

        const [result] = await pool.query(
            'UPDATE exams SET status = ?, scheduled_start = ? WHERE id = ? AND teacher_id = ?',
            [status, scheduled_start || null, id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Exam not found or you are not authorized' });
        }
        res.json({ message: 'Exam scheduled successfully', status, scheduled_start });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Available Exams (for Student - filtered by their department and year)
exports.getAvailableExams = async (req, res) => {
    try {
        // Get the student's own department and year from the DB
        const [studentRows] = await pool.query(
            'SELECT department, year FROM students WHERE id = ?', [req.user.id]
        );
        const student = studentRows[0] || {};

        const studentDept = student.department || null;
        const studentYear = student.year || null;

        // Build dynamic WHERE clauses to handle NULL-safe comparisons properly.
        // In MySQL, `column = NULL` is always FALSE, so we must use IS NULL checks.
        // Logic:
        //   - If target_department IS NULL -> exam is for ALL departments -> always show
        //   - If student has a department set -> also show exams targeting that specific department
        //   - If student has NO department set (NULL) -> only show exams targeting ALL (NULL)
        // Same logic applies to year.
        let deptCondition, yearCondition;
        const params = [];

        if (studentDept) {
            deptCondition = '(e.target_department IS NULL OR e.target_department = ?)';
            params.push(studentDept);
        } else {
            deptCondition = 'e.target_department IS NULL';
        }

        if (studentYear) {
            yearCondition = '(e.target_year IS NULL OR e.target_year = ?)';
            params.push(studentYear);
        } else {
            yearCondition = 'e.target_year IS NULL';
        }

        const [rows] = await pool.query(
            `SELECT e.id, e.title, e.subject, e.duration, e.total_marks, e.passing_marks, e.instructions, e.status, e.scheduled_start,
             e.target_department, e.target_year,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
             FROM exams e
             WHERE e.status IN ('Published', 'Scheduled')
             AND ${deptCondition}
             AND ${yearCondition}
             AND NOT EXISTS (
                 SELECT 1 FROM exam_results er WHERE er.exam_id = e.id AND er.student_id = ?
             )
             ORDER BY e.created_at DESC`,
            [...params, req.user.id]
        );

        // Filter out scheduled exams that haven't started yet
        const availableExams = rows.filter(exam => {
            if (exam.status === 'Published') return true;
            if (exam.status === 'Scheduled' && exam.scheduled_start) {
                return new Date(exam.scheduled_start) <= new Date();
            }
            return false;
        });

        res.json({ exams: availableExams });
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
        if (exam.status !== 'Published' && exam.status !== 'Scheduled') {
            return res.status(403).json({ message: 'Exam is not available' });
        }

        if (exam.status === 'Scheduled' && exam.scheduled_start) {
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

        console.log('[SUBMIT_EXAM] Received:', { examId, studentId, answers, completionTime });

        if (!examId) {
            return res.status(400).json({ error: 'examId is required' });
        }

        // Check if already submitted (prevent duplicates)
        const [existing] = await pool.query(
            'SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?',
            [examId, studentId]
        );
        if (existing.length > 0) {
            console.log('[SUBMIT_EXAM] Already submitted, returning existing result');
            return res.json({ message: 'Exam already submitted', resultId: existing[0].id });
        }

        const [questions] = await pool.query('SELECT id, correct_answer, marks FROM exam_questions WHERE exam_id = ?', [examId]);

        console.log(`[SUBMIT_EXAM] Found ${questions.length} questions for exam ${examId}`);

        let score = 0;
        let correctCount = 0;
        let examTotalMarks = 0;
        const safeAnswers = answers || {};

        questions.forEach(q => {
            examTotalMarks += q.marks;
            // answers keys may be strings (from JSON), q.id is a number
            const studentAnswer = safeAnswers[q.id] !== undefined ? safeAnswers[q.id] : safeAnswers[String(q.id)];
            if (studentAnswer !== undefined && Number(studentAnswer) === Number(q.correct_answer)) {
                score += q.marks;
                correctCount++;
            }
        });

        // Fallback to exam table total_marks if no questions found (unlikely)
        if (examTotalMarks === 0) {
            const [examData] = await pool.query('SELECT total_marks FROM exams WHERE id = ?', [examId]);
            examTotalMarks = examData[0]?.total_marks || 0;
        }

        const safeCompletionTime = completionTime || 0;

        console.log(`[SUBMIT_EXAM] Score: ${score}, Correct: ${correctCount}, Total Marks: ${examTotalMarks}, Time: ${safeCompletionTime}`);

        const [result] = await pool.query(
            'INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_answers, total_marks, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [examId, studentId, score, questions.length, correctCount, examTotalMarks, safeCompletionTime]
        );

        // Mark session as completed
        await pool.query(
            'UPDATE exam_sessions SET status = "completed", end_time = CURRENT_TIMESTAMP WHERE student_id = ? AND exam_id = ? AND status = "active"',
            [studentId, examId]
        );

        logger('SUBMIT_EXAM', `Student ID ${studentId} submitted exam ID ${examId}`, { score, resultId: result.insertId });

        res.json({ message: 'Exam submitted successfully', score, resultId: result.insertId });
    } catch (error) {
        console.error('[SUBMIT_EXAM_ERROR]', error);
        logger('SUBMIT_EXAM_ERROR', `Error submitting exam ID ${req.body?.examId}`, { error: error.message });
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

            // Also update total_marks for the exam
            const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
            await pool.query(
                'UPDATE exams SET total_marks = (SELECT SUM(marks) FROM exam_questions WHERE exam_id = ?) WHERE id = ?',
                [examId, examId]
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
                er.total_marks,
                er.submitted_at,
                s.username as student_name,
                s.email as student_email,
                e.title as exam_title
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

// Get Results for Student (their own results)
exports.getStudentResults = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [results] = await pool.query(`
            SELECT 
                er.id,
                er.exam_id,
                er.score,
                er.total_questions,
                er.correct_answers,
                er.total_marks,
                er.completion_time,
                er.submitted_at,
                e.title as exam_title,
                e.subject as exam_subject,
                e.passing_marks
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            WHERE er.student_id = ?
            ORDER BY er.submitted_at DESC
        `, [studentId]);

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
