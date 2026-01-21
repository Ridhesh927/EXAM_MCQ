const { pool } = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-room', ({ examId, userId, role, name, sessionId }) => {
            socket.join(`exam-${examId}`);
            socket.userId = userId;
            socket.role = role;
            socket.examId = examId;
            socket.sessionId = sessionId; // Store sessionId on socket

            console.log(`${name} (${role}) joined exam room: ${examId}`);

            if (role === 'student') {
                socket.to(`exam-${examId}`).emit('student-connected', { userId, name, socketId: socket.id, sessionId });
            } else if (role === 'teacher') {
                socket.to(`exam-${examId}`).emit('teacher-online', { teacherId: userId });
            }
        });

        // Explicit Leave Exam
        socket.on('leave-exam', async ({ examId, userId, sessionId }) => {
            console.log(`Student ${userId} explicitly left exam ${examId}`);

            // Mark session as terminated in DB
            try {
                await pool.query(
                    'UPDATE exam_sessions SET status = "terminated", end_time = CURRENT_TIMESTAMP WHERE id = ? AND status = "active"',
                    [sessionId]
                );
            } catch (err) {
                console.error('Error terminating session on leave:', err);
            }

            socket.to(`exam-${examId}`).emit('student-left-exam', { userId, sessionId });
            socket.leave(`exam-${examId}`);
        });

        // WebRTC Signaling
        socket.on('signal', ({ to, signal, from }) => {
            io.to(to).emit('signal', { signal, from });
        });

        // Proctoring Warnings
        socket.on('send-warning', ({ studentId, message, type }) => {
            const sockets = io.sockets.adapter.rooms.get(`exam-${socket.examId}`);
            if (sockets) {
                for (const socketId of sockets) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s && s.userId === studentId && s.role === 'student') {
                        io.to(socketId).emit('warning-received', { message, type });
                        break;
                    }
                }
            }
        });

        socket.on('student-warning-trigger', ({ examId, userId, warningType }) => {
            socket.to(`exam-${examId}`).emit('student-warning-alert', { userId, warningType });
        });

        socket.on('disconnect', async () => {
            if (socket.role === 'student' && socket.sessionId) {
                console.log(`Student ${socket.userId} disconnected from session ${socket.sessionId}`);

                // Optional: Mark as terminated on disconnect after a short timeout? 
                // Or just notify teacher. The report says "automatically" mark terminated.
                try {
                    await pool.query(
                        'UPDATE exam_sessions SET status = "terminated", end_time = CURRENT_TIMESTAMP WHERE id = ? AND status = "active"',
                        [socket.sessionId]
                    );
                } catch (err) {
                    console.error('Error terminating session on disconnect:', err);
                }

                socket.to(`exam-${socket.examId}`).emit('student-disconnected', { userId: socket.userId, sessionId: socket.sessionId });
            }
            console.log('User disconnected:', socket.id);
        });
    });
};
