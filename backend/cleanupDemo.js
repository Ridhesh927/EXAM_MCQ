const { pool } = require('./src/config/db');

async function cleanupDemoData() {
    try {
        console.log('🧹 Cleaning up demo data...\n');

        // Delete demo teacher
        const [teacherResult] = await pool.query(
            "DELETE FROM teachers WHERE email = 'teacher@demo.com' OR username = 'demo_teacher'"
        );
        console.log(`✅ Removed ${teacherResult.affectedRows} demo teacher(s)`);

        // Delete demo student
        const [studentResult] = await pool.query(
            "DELETE FROM students WHERE prn_number = 'STU001' OR email = 'student@demo.com' OR username = 'demo_student'"
        );
        console.log(`✅ Removed ${studentResult.affectedRows} demo student(s)`);

        console.log('\n✨ Demo data cleanup complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        process.exit(1);
    }
}

cleanupDemoData();
