const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here');
        req.user = decoded;

        // Skip token check in DB for hardcoded main admin
        if (decoded.id === 0 && decoded.isMainAdmin) {
            return next();
        }

        const table = decoded.role === 'teacher' ? 'teachers' : 'students';
        const [rows] = await pool.query(`SELECT last_token FROM ${table} WHERE id = ?`, [decoded.id]);

        if (rows.length === 0 || rows[0].last_token !== token) {
            return res.status(401).json({ message: 'Session expired or logged in on another device' });
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

const mainAdminMiddleware = (req, res, next) => {
    if (!req.user.isMainAdmin) {
        return res.status(403).json({ message: 'Access denied: Main Admin privileges required' });
    }
    next();
};

module.exports = { authMiddleware, roleMiddleware, mainAdminMiddleware };
