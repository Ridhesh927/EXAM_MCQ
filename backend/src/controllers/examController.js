const { pool } = require('../config/db');
const xlsx = require('xlsx');
const logger = require('../utils/logger');

const normalizeDifficulty = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'easy') return 'Easy';
    if (v === 'high' || v === 'hard') return 'High';
    return 'Medium';
};

// Create Exam
exports.createExam = async (req, res) => {
    try {
        const { title, subject, duration, total_marks, passing_marks, instructions, questions, target_department, target_year, status, scheduled_start, expires_at } = req.body;
        const teacher_id = req.user.id;
        const createdByTeacherId = req.user.isMainAdmin ? null : teacher_id;

        // Main admin has id=0 and no teachers row, so skip FK by storing NULL.
        // For regular teachers, fail early with a clear auth/session message.
        if (!req.user.isMainAdmin) {
            const [teacherRows] = await pool.query('SELECT id FROM teachers WHERE id = ?', [teacher_id]);
            if (!teacherRows.length) {
                return res.status(401).json({
                    error: 'Teacher account not found for current session. Please log in again.'
                });
            }
        }

        if (!expires_at) {
            return res.status(400).json({ error: 'Expiration date (expires_at) is required.' });
        }

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
                'INSERT INTO exams (title, subject, duration, total_marks, passing_marks, instructions, teacher_id, target_department, target_year, status, scheduled_start, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, subject, duration, finalTotalMarks, passing_marks, instructions, createdByTeacherId, target_department || null, target_year || null, status || 'Published', scheduled_start || null, expires_at]
            );

            const examId = examResult.insertId;

            if (questions && questions.length > 0) {
                const questionValues = questions.map(q => [
                    examId,
                    q.question,
                    JSON.stringify(q.options),
                    q.correct_answer,
                    q.marks,
                    normalizeDifficulty(q.difficulty)
                ]);
                await connection.query(
                    'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty) VALUES ?',
                    [questionValues]
                );
            }

            await connection.commit();

            logger('CREATE_EXAM', `Teacher ID ${teacher_id} created exam: ${title}`, {
                examId,
                subject,
                createdByTeacherId,
                isMainAdmin: !!req.user.isMainAdmin
            });

            // Trigger Notifications for Students (Async)
            if (status === 'Published' || !status) {
                createExamNotifications(examId, title, target_department, target_year);
            }

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

// Get All Exams (for any Teacher - shared view originally, now restricted)
exports.getTeacherExams = async (req, res) => {
    try {
        let query = `SELECT e.*, t.username as created_by
             FROM exams e
             LEFT JOIN teachers t ON e.teacher_id = t.id
             WHERE e.is_deleted = FALSE`;
        const params = [];
        
        if (!req.user.isMainAdmin) {
            query += ` AND e.teacher_id = ?`;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY e.created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Exam (restricted to owner or main admin)
exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        let query = 'UPDATE exams SET is_deleted = TRUE WHERE id = ?';
        const params = [id];
        if (!req.user.isMainAdmin) {
            query += ' AND teacher_id = ?';
            params.push(req.user.id);
        }
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        logger('DELETE_EXAM', `Exam ID ${id} soft-deleted by teacher ID ${req.user.id}`);
        res.json({ message: 'Exam deleted successfully (archived)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Exam Details (For Teacher Edit Page - no restrictions originally, now restricted)
exports.getTeacherExamDetails = async (req, res) => {
    try {
        let query = 'SELECT * FROM exams WHERE id = ?';
        const params = [req.params.id];
        if (!req.user.isMainAdmin) {
            query += ' AND teacher_id = ?';
            params.push(req.user.id);
        }
        const [rows] = await pool.query(query, params);
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
        const { title, subject, duration, passing_marks, target_department, target_year, status, questions, expires_at } = req.body;
        const teacher_id = req.user.id;

        if (!expires_at) {
            return res.status(400).json({ error: 'Expiration date (expires_at) is required.' });
        }

        // Verify ownership
        let authQuery = 'SELECT id FROM exams WHERE id = ?';
        const authParams = [id];
        if (!req.user.isMainAdmin) {
            authQuery += ' AND teacher_id = ?';
            authParams.push(teacher_id);
        }
        const [authCheck] = await pool.query(authQuery, authParams);
        if (authCheck.length === 0) return res.status(403).json({ message: 'Unauthorized or exam not found' });

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks !== undefined ? q.marks : 5), 0);

            await connection.query(
                'UPDATE exams SET title=?, subject=?, duration=?, total_marks=?, passing_marks=?, target_department=?, target_year=?, status=?, expires_at=? WHERE id=?',
                [title, subject, duration, calculatedTotalMarks, passing_marks, target_department || null, target_year || null, status || 'Draft', expires_at, id]
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
                    const difficulty = normalizeDifficulty(q.difficulty);
                    return [id, questionText, optionsString, correctAnswer, marks, difficulty];
                });
                await connection.query(
                    'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty) VALUES ?',
                    [questionValues]
                );
            }

            await connection.commit();
            logger('UPDATE_EXAM', `Teacher ID ${teacher_id} updated exam: ${title}`, { examId: id });

            // Trigger Notifications if status changed to Published or updated while Published
            if (status === 'Published') {
                createExamNotifications(id, title, target_department, target_year);
            }

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

        let query = 'UPDATE exams SET status = ?, scheduled_start = ? WHERE id = ?';
        const params = [status, scheduled_start || null, id];
        if (!req.user.isMainAdmin) {
            query += ' AND teacher_id = ?';
            params.push(req.user.id);
        }

        const [result] = await pool.query(query, params);

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
            `SELECT e.id, e.title, e.subject, e.duration, e.total_marks, e.passing_marks, e.instructions, e.status, e.scheduled_start, e.expires_at,
             e.target_department, e.target_year,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) as question_count
             FROM exams e
             WHERE e.status IN ('Published', 'Scheduled')
             AND e.is_deleted = FALSE
             AND ${deptCondition}
             AND ${yearCondition}
             AND e.expires_at > NOW()
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

        if (exam.expires_at) {
            const now = new Date();
            const expiresAt = new Date(exam.expires_at);
            if (now >= expiresAt) {
                return res.status(403).json({ message: 'This exam has expired.' });
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

        let examQuery = 'SELECT COUNT(*) as total FROM exams WHERE is_deleted = FALSE';
        let examParams = [];
        
        let sessionQuery = 'SELECT COUNT(*) as total FROM exam_sessions es JOIN exams e ON es.exam_id = e.id WHERE es.status = "active"';
        let sessionParams = [];
        
        let resultQuery = 'SELECT er.*, s.username as student_name, e.title as exam_title FROM exam_results er JOIN students s ON er.student_id = s.id JOIN exams e ON er.exam_id = e.id WHERE 1=1';
        let resultParams = [];

        if (!req.user.isMainAdmin) {
            examQuery += ' AND teacher_id = ?';
            examParams.push(teacherId);
            
            sessionQuery += ' AND e.teacher_id = ?';
            sessionParams.push(teacherId);
            
            resultQuery += ' AND e.teacher_id = ?';
            resultParams.push(teacherId);
        }

        resultQuery += ' ORDER BY er.submitted_at DESC LIMIT 5';

        const [examCount] = await pool.query(examQuery, examParams);
        const [activeSessions] = await pool.query(sessionQuery, sessionParams);
        const [recentResults] = await pool.query(resultQuery, resultParams);

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

        let query = `
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
            WHERE 1=1
        `;
        const params = [];
        
        if (!req.user.isMainAdmin) {
            query += ` AND e.teacher_id = ?`;
            params.push(teacherId);
        }
        
        query += ` ORDER BY er.submitted_at DESC`;

        const [results] = await pool.query(query, params);

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
// Helper: Create Notifications for target students when an exam is published
async function createExamNotifications(examId, title, dept, year) {
    try {
        let query = 'SELECT id FROM students WHERE 1=1';
        const params = [];

        if (dept) {
            query += ' AND department = ?';
            params.push(dept);
        }
        if (year) {
            query += ' AND year = ?';
            params.push(year);
        }

        const [students] = await pool.query(query, params);

        if (students.length > 0) {
            const notificationValues = students.map(s => [
                s.id,
                'student',
                'New Exam Assigned',
                `A new exam "${title}" has been assigned to your department/year.`,
                `/student/exams`
            ]);

            await pool.query(
                'INSERT INTO notifications (user_id, user_type, title, message, link) VALUES ?',
                [notificationValues]
            );
        }
    } catch (error) {
        console.error('Error creating exam notifications:', error);
    }
}
