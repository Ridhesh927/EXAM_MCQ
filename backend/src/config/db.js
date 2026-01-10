const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ridhu@927',
    database: process.env.DB_NAME || 'exam_portal_v2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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

        console.log('Database initialized successfully.');
        connection.release();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

module.exports = { pool, initDB };
