const { pool } = require('./src/config/db');

async function migrate() {
    try {
        const connection = await pool.getConnection();
        console.log('Migrating database...');

        const tables = {
            'teachers': [
                { column: 'last_token', definition: 'TEXT', after: 'password' }
            ],
            'students': [
                { column: 'last_token', definition: 'TEXT', after: 'prn_number' }
            ],
            'exams': [
                { column: 'scheduled_start', definition: 'DATETIME', after: 'duration' },
                { column: 'status', definition: "ENUM('Draft', 'Published', 'Completed') DEFAULT 'Published'", after: 'total_marks' }
            ]
        };

        for (const [table, columns] of Object.entries(tables)) {
            for (const col of columns) {
                const [rows] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${col.column}'`);
                if (rows.length === 0) {
                    const query = `ALTER TABLE ${table} ADD COLUMN ${col.column} ${col.definition} AFTER ${col.after}`;
                    await connection.query(query);
                    console.log(`Executed: ${query}`);
                } else {
                    console.log(`Column ${col.column} already exists in ${table}`);
                }
            }
        }

        connection.release();
        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
