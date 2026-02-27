const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

async function run() {
    try {
        console.log('Starting DB cleanup and init...');

        // Delete all students
        const [res] = await pool.query('DELETE FROM students');
        console.log(`Deleted ${res.affectedRows} students from the database.`);

        // Check for default admin
        const adminEmail = 'admin@system.com';
        const adminPass = 'admin123';

        const [rows] = await pool.query('SELECT * FROM teachers WHERE email = ?', [adminEmail]);
        if (rows.length === 0) {
            const hash = await bcrypt.hash(adminPass, 10);
            await pool.query(
                'INSERT INTO teachers (username, email, password) VALUES (?, ?, ?)',
                ['Admin User', adminEmail, hash]
            );
            console.log(`Successfully created default admin account: ${adminEmail} / ${adminPass}`);
        } else {
            console.log(`Default admin account already exists: ${adminEmail} / ${adminPass}`);
        }
    } catch (error) {
        console.error('Error during execution:', error);
    } finally {
        process.exit(0);
    }
}

run();
