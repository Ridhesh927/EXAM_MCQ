const express = require('express');
const router = express.Router();
const codingController = require('../controllers/codingController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// All routes require authenticated students
router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// 1. Generate a new 2-question DSA coding round
router.post('/generate', codingController.generateCodingRound);

// 2. Get coding history
router.get('/history', codingController.getCodingHistory);

// 3. Get specific coding round (questions)
router.get('/:id', codingController.getCodingRound);

// 4. Submit code for AI grading
router.post('/:id/submit', codingController.submitCodingRound);

module.exports = router;
