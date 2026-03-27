import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Skeleton from './components/Skeleton';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const AvailableExams = lazy(() => import('./pages/student/AvailableExams'));
const TakeExam = lazy(() => import('./pages/student/TakeExam'));
const TakeInterview = lazy(() => import('./pages/student/TakeInterview'));
const InterviewResults = lazy(() => import('./pages/student/InterviewResults'));
const TakeCodingRound = lazy(() => import('./pages/student/TakeCodingRound'));
const CodingResults = lazy(() => import('./pages/student/CodingResults'));
const StudentResults = lazy(() => import('./pages/student/StudentResults'));
const Settings = lazy(() => import('./pages/student/Settings'));
const InterviewPrepHub = lazy(() => import('./pages/student/InterviewPrepHub'));

// Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const CreateExam = lazy(() => import('./pages/teacher/CreateExam'));
const LiveProctoring = lazy(() => import('./pages/teacher/LiveProctoring'));
const ManageExams = lazy(() => import('./pages/teacher/ManageExams'));
const ManageStudents = lazy(() => import('./pages/teacher/ManageStudents'));
const ManageTeachers = lazy(() => import('./pages/teacher/ManageTeachers'));
const ViewResults = lazy(() => import('./pages/teacher/ViewResults'));
const EditExam = lazy(() => import('./pages/teacher/EditExam'));
const Landing = lazy(() => import('./pages/Landing'));

const PageLoader = () => (
  <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
    <Skeleton height={60} className="mb-8" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
      <Skeleton height={400} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <ThemeToggle />
        </div>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/student/coding/:id" element={<TakeCodingRound />} />
            <Route path="/student/coding/result/:id" element={<CodingResults />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/settings" element={<Settings />} />

            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/exams" element={<ManageExams />} />
            <Route path="/teacher/create-exam" element={<CreateExam />} />
            <Route path="/teacher/edit-exam/:id" element={<EditExam />} />
            <Route path="/teacher/proctor" element={<LiveProctoring />} />
            <Route path="/teacher/students" element={<ManageStudents />} />
            <Route path="/admin/teachers" element={<ManageTeachers />} />
            <Route path="/teacher/results" element={<ViewResults />} />
            <Route path="/teacher/settings" element={<Settings userType="teacher" />} />
          </Routes>
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App;
