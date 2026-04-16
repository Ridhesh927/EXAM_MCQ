const { pool } = require('./src/config/db');

async function check() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                COALESCE(NULLIF(eq.topic, ''), e.subject, 'General') as topic,
                COUNT(sr.id) as attempts
             FROM student_responses sr
             JOIN exam_sessions es ON sr.session_id = es.id
             JOIN exam_questions eq ON sr.question_id = eq.id
             JOIN exams e ON es.exam_id = e.id
             WHERE e.is_deleted = FALSE
             GROUP BY topic`
        );
        console.log('Topic Rows:', rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
