const cron = require('node-cron');
const { pool } = require('../config/db');
const logger = require('./logger');

const startCronJobs = () => {
    // Run every minute to check for expired exams
    cron.schedule('* * * * *', async () => {
        try {
            const [result] = await pool.query('DELETE FROM exams WHERE expires_at < NOW()');
            if (result.affectedRows > 0) {
                logger('CRON_JOB', `Auto-deleted ${result.affectedRows} expired exams.`);
                console.log(`[CRON] Auto-deleted ${result.affectedRows} expired exams.`);
            }
        } catch (error) {
            logger('CRON_ERROR', 'Failed to auto-delete expired exams', { error: error.message });
            console.error('[CRON ERROR]', error);
        }
    });

    console.log('Cron jobs initialized: Auto-delete expired exams scheduled.');
};

module.exports = { startCronJobs };
