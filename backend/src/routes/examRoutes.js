const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Teacher routes
router.post('/create', authMiddleware, roleMiddleware(['teacher']), examController.createExam);
router.post('/upload-bulk', authMiddleware, roleMiddleware(['teacher']), upload.single('file'), examController.uploadBulkQuestions);
router.get('/teacher/my-exams', authMiddleware, roleMiddleware(['teacher']), examController.getTeacherExams);
router.get('/teacher/stats', authMiddleware, roleMiddleware(['teacher']), examController.getDashboardStats);
router.get('/teacher/results', authMiddleware, roleMiddleware(['teacher']), examController.getTeacherResults);
router.get('/teacher/active-sessions/:examId', authMiddleware, roleMiddleware(['teacher']), examController.getActiveSessions);

// Student routes
router.get('/student/available', authMiddleware, roleMiddleware(['student']), examController.getAvailableExams);
router.get('/:id', authMiddleware, roleMiddleware(['student']), examController.getExamDetails);
router.post('/session/start', authMiddleware, roleMiddleware(['student']), examController.startExamSession);
router.post('/session/warning', authMiddleware, roleMiddleware(['student']), examController.logWarning);
router.post('/session/response', authMiddleware, roleMiddleware(['student']), examController.updateResponse);
router.post('/submit', authMiddleware, roleMiddleware(['student']), examController.submitExam);

module.exports = router;
