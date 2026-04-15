const { pool } = require('../config/db');
const { generateText } = require('../utils/aiClient');

const jobController = {
    getAllJobs: async (req, res) => {
        try {
            const [rows] = await pool.query(
                'SELECT j.*, t.username as author FROM jobs j LEFT JOIN teachers t ON j.created_by = t.id WHERE j.status = "Open" ORDER BY j.created_at DESC'
            );
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createJob: async (req, res) => {
        try {
            const { title, company, location, job_type, description, requirements, salary_range } = req.body;
            const teacher_id = req.user.id;

            const [result] = await pool.query(
                'INSERT INTO jobs (title, company, location, job_type, description, requirements, salary_range, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [title, company, location, job_type, description, requirements, salary_range, teacher_id]
            );

            res.status(201).json({ message: 'Job posted successfully', jobId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    applyForJob: async (req, res) => {
        try {
            const jobId = req.params.jobId;
            const student_id = req.user.id;

            const [existing] = await pool.query(
                'SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?',
                [jobId, student_id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'You have already applied for this position' });
            }

            const [student] = await pool.query('SELECT resume_text FROM students WHERE id = ?', [student_id]);
            const [job] = await pool.query('SELECT description, requirements FROM jobs WHERE id = ?', [jobId]);
            
            let matchScore = 0;
            if (student[0]?.resume_text && job[0]) {
                try {
                    const prompt = `Match job description: ${job[0].description} with resume: ${student[0].resume_text.substring(0, 500)}. Score 0-100?`;
                    const { content } = await generateText({
                        taskType: 'reporting',
                        prompt,
                        temperature: 0.1,
                        groqModel: 'llama-3.1-8b-instant'
                    });
                    matchScore = parseInt(content.replace(/\D/g, '')) || 0;
                } catch (aiErr) {
                    console.warn('[Job Match AI] Failed:', aiErr.message);
                }
            }

            await pool.query(
                'INSERT INTO job_applications (job_id, student_id, ai_match_score) VALUES (?, ?, ?)',
                [jobId, student_id, matchScore]
            );

            res.status(201).json({ message: 'Application submitted successfully', matchScore });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getJobApplications: async (req, res) => {
        try {
            const jobId = req.params.jobId;
            const [rows] = await pool.query(
                `SELECT ja.*, s.username as student_name, s.email, s.parsed_skills
                 FROM job_applications ja
                 JOIN students s ON ja.student_id = s.id
                 WHERE ja.job_id = ?
                 ORDER BY ja.ai_match_score DESC`,
                [jobId]
            );
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = jobController;
