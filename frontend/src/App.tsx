import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableExams from './pages/student/AvailableExams';
import TakeExam from './pages/student/TakeExam';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExam from './pages/teacher/CreateExam';
import LiveProctoring from './pages/teacher/LiveProctoring';
import ManageExams from './pages/teacher/ManageExams';
import ManageStudents from './pages/teacher/ManageStudents';
import ViewResults from './pages/teacher/ViewResults';

import Landing from './pages/Landing';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/exams" element={<AvailableExams />} />
        <Route path="/student/exam/:id" element={<TakeExam />} />

        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/exams" element={<ManageExams />} />
        <Route path="/teacher/create-exam" element={<CreateExam />} />
        <Route path="/teacher/proctor" element={<LiveProctoring />} />
        <Route path="/teacher/students" element={<ManageStudents />} />
        <Route path="/teacher/results" element={<ViewResults />} />
      </Routes>
    </div>
  );
}

export default App;
