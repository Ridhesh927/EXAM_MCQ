module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-room', ({ examId, userId, role, name }) => {
            socket.join(`exam-${examId}`);
            socket.userId = userId;
            socket.role = role;
            socket.examId = examId;

            console.log(`${name} (${role}) joined exam room: ${examId}`);

            if (role === 'student') {
                // Notify teacher that a student joined
                socket.to(`exam-${examId}`).emit('student-connected', { userId, name, socketId: socket.id });
            } else if (role === 'teacher') {
                // Notify students that teacher is present
                socket.to(`exam-${examId}`).emit('teacher-online', { teacherId: userId });
            }
        });

        // WebRTC Signaling
        socket.on('signal', ({ to, signal, from }) => {
            io.to(to).emit('signal', { signal, from });
        });

        // Proctoring Warnings
        socket.on('send-warning', ({ studentId, message, type }) => {
            // Teacher sends warning to specific student
            // We need to find the student's socket
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
            // Student triggers a warning (e.g., tab switch)
            socket.to(`exam-${examId}`).emit('student-warning-alert', { userId, warningType });
        });

        socket.on('disconnect', () => {
            if (socket.role === 'student') {
                socket.to(`exam-${socket.examId}`).emit('student-disconnected', { userId: socket.userId });
            }
            console.log('User disconnected:', socket.id);
        });
    });
};
