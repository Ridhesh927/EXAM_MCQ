const { pool, initDB } = require('./src/config/db');

async function wipeDatabase() {
    console.log('🚀 Starting deep database wipe...');
    const connection = await pool.getConnection();

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'exam_learning_recommendations',
            'exam_session_actions',
            'exam_warnings',
            'student_responses',
            'exam_results',
            'exam_sessions',
            'exam_questions',
            'exams',
            'students',
            'job_applications',
            'jobs'
        ];

        for (const table of tables) {
            console.log(`Cleaning ${table}...`);
            await connection.query(`TRUNCATE TABLE ${table}`);
        }

        // Clean teachers but KEEP Main Admins
        console.log('Removing non-admin teachers...');
        await connection.query('DELETE FROM teachers WHERE is_main_admin = FALSE');
        
        // Reset auto-increments
        await connection.query('ALTER TABLE teachers AUTO_INCREMENT = 1');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Wipe complete!');

        // Re-sync admin account from .env to be 100% sure
        console.log('Synchronizing admin account...');
        await initDB();

        console.log('\n✨ Database is now clean and ready for real users!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Wipe failed:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

wipeDatabase();
