const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Public/Student routes
router.get('/', authMiddleware, jobController.getAllJobs);
router.post('/apply/:jobId', authMiddleware, roleMiddleware(['student']), jobController.applyForJob);

// Teacher/Admin routes
router.post('/create', authMiddleware, roleMiddleware(['teacher', 'admin']), jobController.createJob);
router.get('/:jobId/applications', authMiddleware, roleMiddleware(['teacher', 'admin']), jobController.getJobApplications);

module.exports = router;
