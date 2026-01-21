const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here', {
        expiresIn: '24h'
    });
};

// Teacher Register
exports.registerTeacher = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO teachers (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: 'Teacher registered successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Teacher Login
exports.loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Demo Bypass
        if (email === 'teacher@demo.com' && password === 'Teacher@123') {
            const token = generateToken(0, 'teacher');
            return res.json({ token, user: { id: 0, username: 'Demo Teacher', role: 'teacher' } });
        }

        const [rows] = await pool.query('SELECT * FROM teachers WHERE email = ?', [email]);

        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const teacher = rows[0];
        const isMatch = await bcrypt.compare(password, teacher.password);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(teacher.id, 'teacher');

        // Store last token
        await pool.query('UPDATE teachers SET last_token = ? WHERE id = ?', [token, teacher.id]);

        res.json({ token, user: { id: teacher.id, username: teacher.username, role: 'teacher' } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Student Register (PRN verification is implicit here, usually would check against a pre-registered list)
exports.registerStudent = async (req, res) => {
    try {
        const { username, email, password, prn_number } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO students (username, email, password, prn_number) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, prn_number]
        );

        res.status(201).json({ message: 'Student registered successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Student Login
exports.loginStudent = async (req, res) => {
    try {
        const { prn_number, password } = req.body;

        // Demo Bypass
        if ((prn_number === 'STU001' || prn_number === 'student@demo.com') && password === 'Student@123') {
            const token = generateToken(0, 'student');
            return res.json({
                token,
                user: { id: 0, username: 'Demo Student', role: 'student', prn: 'STU001' },
                message: 'Demo access granted'
            });
        }

        const [rows] = await pool.query('SELECT * FROM students WHERE prn_number = ?', [prn_number]);

        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const student = rows[0];
        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(student.id, 'student');

        // Store last token
        await pool.query('UPDATE students SET last_token = ? WHERE id = ?', [token, student.id]);

        res.json({
            token,
            user: { id: student.id, username: student.username, role: 'student', prn: student.prn_number },
            message: 'Authenticated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const { id, role } = req.user;
        const table = role === 'teacher' ? 'teachers' : 'students';

        // Get current user
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

        // Hash and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, id]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
