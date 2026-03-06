const { pool } = require('./src/config/db');

async function update() {
    try {
        const [desc] = await pool.query('DESCRIBE exams');
        const hasStatus = desc.some(c => c.Field === 'status');

        if (hasStatus) {
            await pool.query("ALTER TABLE exams MODIFY COLUMN status ENUM('Draft', 'Published', 'Scheduled', 'Completed') DEFAULT 'Published'");
            console.log("Schema modified status column");
        } else {
            await pool.query("ALTER TABLE exams ADD COLUMN status ENUM('Draft', 'Published', 'Scheduled', 'Completed') DEFAULT 'Published'");
            console.log("Schema added status column");
        }

        // Ensure scheduled_start exists
        const hasScheduledStart = desc.some(c => c.Field === 'scheduled_start');
        if (!hasScheduledStart) {
            await pool.query("ALTER TABLE exams ADD COLUMN scheduled_start DATETIME");
            console.log("Schema added scheduled_start column");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
update();
