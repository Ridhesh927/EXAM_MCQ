const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

async function seed() {
    console.log('Starting comprehensive data seeding...');
    let connection;
    try {
        connection = await pool.getConnection();

        // 0. Clean old data to ensure consistent stats
        console.log('Cleaning old data...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE exam_warnings');
        await connection.query('TRUNCATE TABLE exam_session_actions');
        await connection.query('TRUNCATE TABLE exam_learning_recommendations');
        await connection.query('TRUNCATE TABLE student_responses');
        await connection.query('TRUNCATE TABLE exam_results');
        await connection.query('TRUNCATE TABLE exam_sessions');
        await connection.query('TRUNCATE TABLE exam_questions');
        await connection.query('TRUNCATE TABLE exams');
        await connection.query('TRUNCATE TABLE students');
        await connection.query('TRUNCATE TABLE teachers');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const hashedPassword = await bcrypt.hash('password123', 12);

        // 1. Create Teachers
        console.log('Seeding teachers...');
        
        // Include the Main Admin from environment variables if possible, or a default
        const adminUsername = process.env.ADMIN_USERNAME || 'Main Admin1';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@system1.com';
        const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'password123';
        const adminPassword = adminPasswordRaw.trim();
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

        const teachers = [
            [adminUsername, adminEmail, hashedAdminPassword, true], // Is Main Admin
            ['Dr. Smith', 'smith@example.com', hashedPassword, false],
            ['Prof. Johnson', 'johnson@example.com', hashedPassword, false],
            ['Ms. Davis', 'davis@example.com', hashedPassword, false]
        ];
        
        const teacherIds = [];
        for (const [username, email, pwd, isMainAdmin] of teachers) {
            const [result] = await connection.query(
                'INSERT INTO teachers (username, email, password, is_main_admin) VALUES (?, ?, ?, ?)',
                [username, email, pwd, isMainAdmin]
            );
            teacherIds.push(result.insertId);
        }

        // 2. Create Students
        console.log('Seeding students...');
        const students = [
            ['Alice Wonderland', 'alice@student.com', 'S101'],
            ['Bob Builder', 'bob@student.com', 'S102'],
            ['Charlie Brown', 'charlie@student.com', 'S103'],
            ['David Miller', 'david@student.com', 'S104'],
            ['Eve Adams', 'eve@student.com', 'S105'],
            ['Frank Wright', 'frank@student.com', 'S106'],
            ['Grace Hopper', 'grace@student.com', 'S107'],
            ['Hank Pym', 'hank@student.com', 'S108'],
            ['Ivy Poison', 'ivy@student.com', 'S109'],
            ['Jack Sparrow', 'jack@student.com', 'S110']
        ];
        const studentIds = [];
        for (const [username, email, prn] of students) {
            const [result] = await connection.query(
                'INSERT INTO students (username, email, password, prn_number) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, prn]
            );
            studentIds.push(result.insertId);
        }

        // 3. Load questions from CSV
        const csvPath = path.join(__dirname, '..', 'csv', 'unified_exam_dataset.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const records = parse(csvData, { columns: true, skip_empty_lines: true });

        // 4. Create Exams and Questions
        console.log('Seeding exams and questions...');
        const subjects = ['AI & ML', 'Python', 'Deep Learning', 'Models'];
        const examIds = [];
        for (let i = 0; i < 4; i++) {
            const teacherId = teacherIds[i % teacherIds.length];
            const subject = subjects[i];
            const title = `${subject} Finals 2026`;
            const expires_at = new Date();
            expires_at.setFullYear(expires_at.getFullYear() + 1);

            const [examResult] = await connection.query(
                'INSERT INTO exams (title, subject, duration, total_marks, passing_marks, status, teacher_id, instructions, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, subject, 45, 10, 4, 'Published', teacherId, 'Calculators are NOT allowed.', expires_at]
            );
            const examId = examResult.insertId;
            examIds.push({ id: examId, subject, teacherId });

            const subjectQuestions = records.filter(r => r.section === subject).sort(() => 0.5 - Math.random()).slice(0, 10);
            for (const q of subjectQuestions) {
                const options = JSON.stringify([q.a, q.b, q.c, q.d]);
                const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                await connection.query(
                    'INSERT INTO exam_questions (exam_id, question, options, correct_answer, marks, difficulty, topic) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [examId, q.question, options, answerMap[q.answer] || 0, 1, q.difficulty || 'Medium', q.topic || 'General']
                );
            }
        }

        // 5. Seeding Sessions, Warnings, and Responses (The "Analytics" meat)
        console.log('Seeding sessions, performance data, and warnings...');
        for (const examData of examIds) {
            const [questions] = await connection.query('SELECT * FROM exam_questions WHERE exam_id = ?', [examData.id]);
            
            // Each student takes each exam with varying success
            for (const studentId of studentIds) {
                const isVeryGood = Math.random() > 0.7;
                const isCheater = Math.random() > 0.8;
                
                const startTime = new Date();
                startTime.setHours(startTime.getHours() - Math.floor(Math.random() * 24));
                const endTime = new Date(startTime.getTime() + (20 + Math.random() * 20) * 60000);

                // Create Session
                const warningsCount = isCheater ? Math.floor(Math.random() * 5) + 1 : 0;
                const status = (isCheater && warningsCount > 3) ? 'terminated' : 'completed';
                const [sessionResult] = await connection.query(
                    'INSERT INTO exam_sessions (student_id, exam_id, start_time, end_time, warnings_count, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [studentId, examData.id, startTime, endTime, warningsCount, status]
                );
                const sessionId = sessionResult.insertId;

                // Add Warnings if applicable
                if (isCheater) {
                    const warningTypes = ['tab-switch', 'no-face', 'multiple-people', 'eye-tracking'];
                    for (let w = 0; w < warningsCount; w++) {
                        const type = warningTypes[Math.floor(Math.random() * warningTypes.length)];
                        await connection.query(
                            'INSERT INTO exam_warnings (session_id, warning_type, message) VALUES (?, ?, ?)',
                            [sessionId, type, `Suspicious ${type} activity detected.`]
                        );
                    }
                    if (warningsCount > 2) {
                        await connection.query(
                            'INSERT INTO exam_session_actions (session_id, exam_id, student_id, action_type, reason, actioned_by_role) VALUES (?, ?, ?, ?, ?, ?)',
                            [sessionId, examData.id, studentId, 'warn', 'Repeated violations flagged by AI.', 'system']
                        );
                    }
                }

                // Add Responses and Calculate Score
                let score = 0;
                for (const q of questions) {
                    const isCorrect = isVeryGood ? (Math.random() > 0.1) : (Math.random() > 0.4);
                    const selected = isCorrect ? q.correct_answer : (q.correct_answer + 1) % 4;
                    if (isCorrect) score++;

                    await connection.query(
                        'INSERT INTO student_responses (session_id, question_id, selected_option, time_spent) VALUES (?, ?, ?, ?)',
                        [sessionId, q.id, selected, Math.floor(Math.random() * 60) + 10]
                    );
                }

                // Create Result
                if (status === 'completed' || status === 'terminated') {
                    await connection.query(
                        'INSERT INTO exam_results (exam_id, student_id, score, total_questions, correct_answers, completion_time, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [examData.id, studentId, score, questions.length, score, (endTime - startTime) / 1000, questions.length]
                    );
                }
            }
        }

        console.log('Seeding successful! Teacher analytics should now be rich with graphs and insights.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seed();
