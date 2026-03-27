const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authMiddleware, roleMiddleware, mainAdminMiddleware } = require('../middleware/auth');

// Public routes - Login only
router.post('/teacher/login', authController.loginTeacher);
router.post('/student/login', authController.loginStudent);

// Public registration disabled - only admins can create accounts
// router.post('/teacher/register', authController.registerTeacher);
// router.post('/student/register', authController.registerStudent);

// Protected routes
router.put('/change-password', authMiddleware, authController.changePassword);

// Admin-only routes (main admin only for teachers)
router.post('/admin/create-teacher', authMiddleware, mainAdminMiddleware, authController.adminCreateTeacher);
router.post('/admin/bulk-teachers', authMiddleware, mainAdminMiddleware, authController.adminCreateBulkTeachers);
router.get('/admin/teachers', authMiddleware, mainAdminMiddleware, authController.getAllTeachers);

// Teacher routes (all teachers can manage students)
router.post('/admin/create-student', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateStudent);
router.post('/admin/bulk-students', authMiddleware, roleMiddleware(['teacher']), authController.adminCreateBulkStudents);
router.get('/admin/students', authMiddleware, roleMiddleware(['teacher']), authController.getAllStudents);
router.delete('/admin/user/:role/:id', authMiddleware, (req, res, next) => {
    if (req.params.role === 'teacher') return mainAdminMiddleware(req, res, next);
    return roleMiddleware(['teacher'])(req, res, next);
}, authController.deleteUser);

router.delete('/admin/bulk-delete/:role', authMiddleware, (req, res, next) => {
    if (req.params.role === 'teacher') return mainAdminMiddleware(req, res, next);
    return roleMiddleware(['teacher'])(req, res, next);
}, authController.bulkDeleteUsers);

router.put('/admin/user/:role/:id/toggle-block', authMiddleware, (req, res, next) => {
    if (req.params.role === 'teacher') return mainAdminMiddleware(req, res, next);
    return roleMiddleware(['teacher'])(req, res, next);
}, authController.toggleBlockUser);

module.exports = router;
