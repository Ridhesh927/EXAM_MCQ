const { pool } = require('./src/config/db');

async function check() {
    try {
        const [overviewRows] = await pool.query(
            `SELECT
                COUNT(DISTINCT e.id) as total_exams,
                COUNT(DISTINCT er.id) as evaluated_attempts,
                COUNT(DISTINCT CASE WHEN er.total_marks > 0 AND (er.score / er.total_marks) >= 0.75 THEN er.id END) as distinction_attempts,
                ROUND(AVG(CASE WHEN er.total_marks > 0 THEN (er.score / er.total_marks) * 100 END), 2) as avg_score
             FROM exams e
             LEFT JOIN exam_results er ON er.exam_id = e.id
             WHERE e.is_deleted = FALSE`
        );
        console.log('Overview:', overviewRows[0]);

        const [results] = await pool.query("SELECT * FROM exam_results LIMIT 1");
        console.log('Sample Result:', results[0]);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
