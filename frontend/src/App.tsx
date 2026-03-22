import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableExams from './pages/student/AvailableExams';
import TakeExam from './pages/student/TakeExam';
import TakeInterview from './pages/student/TakeInterview';
import InterviewResults from './pages/student/InterviewResults';
import StudentResults from './pages/student/StudentResults';
import Settings from './pages/student/Settings';
import InterviewPrepHub from './pages/student/InterviewPrepHub';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExam from './pages/teacher/CreateExam';
import LiveProctoring from './pages/teacher/LiveProctoring';
import ManageExams from './pages/teacher/ManageExams';
import ManageStudents from './pages/teacher/ManageStudents';
import ViewResults from './pages/teacher/ViewResults';
import EditExam from './pages/teacher/EditExam';
import Landing from './pages/Landing';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <ThemeToggle />
        </div>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exams" element={<AvailableExams />} />
          <Route path="/student/interview-prep" element={<InterviewPrepHub standalone={true} />} />
          <Route path="/student/exam/:id" element={<TakeExam />} />
          <Route path="/student/interview/:id" element={<TakeInterview />} />
          <Route path="/student/interview/result/:id" element={<InterviewResults />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/settings" element={<Settings />} />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/exams" element={<ManageExams />} />
          <Route path="/teacher/create-exam" element={<CreateExam />} />
          <Route path="/teacher/edit-exam/:id" element={<EditExam />} />
          <Route path="/teacher/proctor" element={<LiveProctoring />} />
          <Route path="/teacher/students" element={<ManageStudents />} />
          <Route path="/teacher/results" element={<ViewResults />} />
          <Route path="/teacher/settings" element={<Settings userType="teacher" />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
