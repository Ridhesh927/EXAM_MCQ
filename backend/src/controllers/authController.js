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

        const [rows] = await pool.query('SELECT * FROM teachers WHERE email = ?', [email]);

        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const teacher = rows[0];
        const isMatch = await bcrypt.compare(password, teacher.password);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(teacher.id, 'teacher');

        // Store last token
        await pool.query('UPDATE teachers SET last_token = ? WHERE id = ?', [token, teacher.id]);

        res.json({ token, user: { id: teacher.id, username: teacher.username, email: teacher.email, role: 'teacher' } });
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
            user: { id: student.id, username: student.username, email: student.email, role: 'student', prn: student.prn_number },
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

// ============ ADMIN ENDPOINTS ============

// Admin: Create Teacher
exports.adminCreateTeacher = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO teachers (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: { id: result.insertId, username, email }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Admin: Create Student
exports.adminCreateStudent = async (req, res) => {
    try {
        const { username, email, password, prn_number } = req.body;

        if (!username || !email || !password || !prn_number) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO students (username, email, password, prn_number) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, prn_number]
        );

        res.status(201).json({
            message: 'Student created successfully',
            student: { id: result.insertId, username, email, prn_number }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email or PRN already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Admin: Bulk Create Students
exports.adminCreateBulkStudents = async (req, res) => {
    try {
        const { students } = req.body; // Array of {username, email, password, prn_number}

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Students array is required' });
        }

        const results = { success: [], failed: [] };

        for (const student of students) {
            try {
                const { username, email, password, prn_number } = student;

                if (!username || !email || !password || !prn_number) {
                    results.failed.push({ student, reason: 'Missing required fields' });
                    continue;
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const [result] = await pool.query(
                    'INSERT INTO students (username, email, password, prn_number) VALUES (?, ?, ?, ?)',
                    [username, email, hashedPassword, prn_number]
                );

                results.success.push({ id: result.insertId, username, email, prn_number });
            } catch (error) {
                results.failed.push({ student, reason: error.message });
            }
        }

        res.status(201).json({
            message: `Created ${results.success.length} students, ${results.failed.length} failed`,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Bulk Create Teachers
exports.adminCreateBulkTeachers = async (req, res) => {
    try {
        const { teachers } = req.body; // Array of {username, email, password}

        if (!Array.isArray(teachers) || teachers.length === 0) {
            return res.status(400).json({ message: 'Teachers array is required' });
        }

        const results = { success: [], failed: [] };

        for (const teacher of teachers) {
            try {
                const { username, email, password } = teacher;

                if (!username || !email || !password) {
                    results.failed.push({ teacher, reason: 'Missing required fields' });
                    continue;
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const [result] = await pool.query(
                    'INSERT INTO teachers (username, email, password) VALUES (?, ?, ?)',
                    [username, email, hashedPassword]
                );

                results.success.push({ id: result.insertId, username, email });
            } catch (error) {
                results.failed.push({ teacher, reason: error.message });
            }
        }

        res.status(201).json({
            message: `Created ${results.success.length} teachers, ${results.failed.length} failed`,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get All Teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const [teachers] = await pool.query(
            'SELECT id, username, email, created_at FROM teachers ORDER BY created_at DESC'
        );
        res.json({ teachers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get All Students
exports.getAllStudents = async (req, res) => {
    try {
        const [students] = await pool.query(
            'SELECT id, username, email, prn_number, created_at FROM students ORDER BY created_at DESC'
        );
        res.json({ students });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { role, id } = req.params;

        if (role !== 'teacher' && role !== 'student') {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const table = role === 'teacher' ? 'teachers' : 'students';
        const [result] = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
