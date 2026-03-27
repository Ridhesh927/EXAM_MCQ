const { pool } = require('./src/config/db');

async function testNotifications() {
    try {
        console.log('Testing notification trigger...');
        // Assume student with ID 1 exists
        const studentId = 1;
        const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [studentId]);
        if (rows.length === 0) {
            console.log('No student found with ID 1. Skipping test.');
            return;
        }

        const dept = rows[0].department;
        const year = rows[0].year;

        console.log(`Student found: ${rows[0].username} (${dept}/${year})`);

        // Manually trigger the helper logic from examController
        const title = "Test Notification Exam " + Date.now();
        
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
        console.log(`Found ${students.length} students to notify.`);

        if (students.length > 0) {
            const notificationValues = students.map(s => [
                s.id,
                'student',
                'New Exam Assigned (Test)',
                `A new exam "${title}" has been assigned.`,
                `/student/exams`
            ]);

            await pool.query(
                'INSERT INTO notifications (user_id, user_type, title, message, link) VALUES ?',
                [notificationValues]
            );
            console.log('Notifications inserted successfully.');
        }

        // Verify insertion
        const [notifs] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1');
        console.log('Latest notification:', notifs[0]);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testNotifications();
