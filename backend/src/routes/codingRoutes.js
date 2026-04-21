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

// 2b. Company library for company-focused rounds
router.get('/companies', codingController.getCompanyLibrary);

// 3. Get specific coding round (questions)
router.get('/:id', codingController.getCodingRound);

// 4. Submit code for AI grading
router.post('/:id/submit', codingController.submitCodingRound);

// 5. Secure code execution proxy (No ID required, but requires student auth)
router.post('/execute', codingController.executeCode);

module.exports = router;
