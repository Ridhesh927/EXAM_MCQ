const { pool } = require('./src/config/db');

async function test() {
    let connection;
    try {
        connection = await pool.getConnection();
        const id = 1; // Testing with some exam. If it fails, we will see the error.
        await connection.query(
            'DELETE FROM student_responses WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id = ?)',
            [id]
        );
        await connection.query('DELETE FROM exam_questions WHERE exam_id = ?', [id]);
        console.log("Success deleting");
    } catch (e) {
        console.log("EXACT ERROR:", e.message);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}
test();
