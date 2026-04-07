const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD must be configured in environment variables.');
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'exam_portal_v2',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 20),
    queueLimit: 0
});

const ensureSecurityColumns = async (connection) => {
    await connection.query(
        'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_main_admin BOOLEAN DEFAULT FALSE'
    );
};

const ensureMainAdminAccount = async (connection) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || 'Main Admin';

    if (!adminEmail || !adminPassword) {
        console.warn('ADMIN_EMAIL/ADMIN_PASSWORD are not configured. Main admin bootstrap skipped.');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const [rows] = await connection.query('SELECT id FROM teachers WHERE email = ?', [adminEmail]);

    if (rows.length === 0) {
        await connection.query(
            'INSERT INTO teachers (username, email, password, is_main_admin, is_blocked) VALUES (?, ?, ?, TRUE, FALSE)',
            [adminUsername, adminEmail, hashedPassword]
        );
        console.log('Main admin account bootstrapped successfully.');
        return;
    }

    await connection.query(
        'UPDATE teachers SET username = ?, password = ?, is_main_admin = TRUE, is_blocked = FALSE WHERE id = ?',
        [adminUsername, hashedPassword, rows[0].id]
    );
    console.log('Main admin account synchronized successfully.');
};

const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL Database.');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema commands (splitting by semicolon)
        const commands = schema.split(';').filter(cmd => cmd.trim());
        for (const command of commands) {
            await connection.query(command);
        }

        await ensureSecurityColumns(connection);
        await ensureMainAdminAccount(connection);

        console.log('Database initialized successfully.');
        connection.release();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

module.exports = { pool, initDB };
