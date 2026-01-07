const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Teacher routes
router.post('/create', authMiddleware, roleMiddleware(['teacher']), examController.createExam);
router.get('/teacher/my-exams', authMiddleware, roleMiddleware(['teacher']), examController.getTeacherExams);

// Student routes
router.get('/:id', authMiddleware, roleMiddleware(['student']), examController.getExamDetails);
router.post('/submit', authMiddleware, roleMiddleware(['student']), examController.submitExam);

module.exports = router;
