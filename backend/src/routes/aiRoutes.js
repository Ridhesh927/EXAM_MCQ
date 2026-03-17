const express = require('express');
const { generateQuestions } = require('../controllers/aiController.js');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.js');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Only teachers and admins can generate questions
router.post('/generate-questions', authMiddleware, roleMiddleware(['teacher', 'admin']), upload.single('file'), generateQuestions);

module.exports = router;
