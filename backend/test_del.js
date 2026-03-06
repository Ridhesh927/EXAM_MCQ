const { pool } = require('./src/config/db');

async function test() {
    try {
        const id = 1; // Assuming exam id 1 or we can just run the exact update query from controller
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM exam_questions WHERE exam_id = 15');
        console.log('Delete success');
        connection.release();
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
