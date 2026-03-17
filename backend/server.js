const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB } = require('./src/config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const adminRoutes = require('./src/routes/adminRoutes'); // Import admin routes
const interviewRoutes = require('./src/routes/interviewRoutes'); // Import Interview routes

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes); // Mount admin routes
app.use('/api/interview', interviewRoutes); // Mount Interview routes

// Initialize Database
initDB();

// Basic Route
app.get('/', (req, res) => {
    res.send('Exam Portal Backend Running...');
});

// Socket.io Logic
require('./src/sockets/proctoringSocket')(io);

const PORT = process.env.PORT || 5000;
// Triggers nodemon restart
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
