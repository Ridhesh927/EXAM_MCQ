const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Public routes - Login only
router.post('/teacher/login', authController.loginTeacher);
router.post('/student/login', authController.loginStudent);

// Public registration disabled - only admins can create accounts
// router.post('/teacher/register', authController.registerTeacher);
// router.post('/student/register', authController.registerStudent);

// Protected routes
router.put('/change-password', authMiddleware, authController.changePassword);

// Admin-only routes (teachers can manage users)
router.post('/admin/create-teacher', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateTeacher);
router.post('/admin/create-student', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateStudent);
router.post('/admin/bulk-students', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateBulkStudents);
router.post('/admin/bulk-teachers', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateBulkTeachers);
router.get('/admin/teachers', authMiddleware, roleMiddleware(['teacher']), authController.getAllTeachers);
router.get('/admin/students', authMiddleware, roleMiddleware(['teacher']), authController.getAllStudents);
router.delete('/admin/user/:role/:id', authMiddleware, roleMiddleware(['teacher']), authController.deleteUser);
router.put('/admin/user/:role/:id/toggle-block', authMiddleware, roleMiddleware(['teacher']), authController.toggleBlockUser);

module.exports = router;
