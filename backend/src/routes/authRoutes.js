const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware } = require('../middleware/auth');

router.post('/teacher/register', authController.registerTeacher);
router.post('/teacher/login', authController.loginTeacher);
router.post('/student/register', authController.registerStudent);
router.post('/student/login', authController.loginStudent);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
