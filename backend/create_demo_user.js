require('dotenv').config();
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

const createDemoStudent = async () => {
    try {
        const prn = 'DEMO123';
        const email = 'demo@student.com';
        const password = 'password123';
        const username = 'Demo Student';

        // Check if exists
        const [rows] = await pool.query('SELECT * FROM students WHERE prn_number = ?', [prn]);

        if (rows.length > 0) {
            console.log('Demo student already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO students (username, email, password, prn_number) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, prn]
        );

        console.log('Demo student created successfully.');
        console.log(`PRN: ${prn}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo student:', error);
        process.exit(1);
    }
};

createDemoStudent();
