import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookCheck, ArrowRight, Loader2, BookOpen, FileText, Upload, LogOut, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../utils/auth';
import { apiFetch } from '../../utils/api';
import { clearAuth } from '../../utils/auth';
import './StudentDashboard.css';

import AvailableExams from './AvailableExams';
import StudentResults from './StudentResults';
import InterviewPrepHub from './InterviewPrepHub';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'results' | 'interview'>('available');
  const [examsTaken, setExamsTaken] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken('student');
        const response = await fetch('http://localhost:5000/api/exams/student/available', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.exams) {
          setExams(data.exams);
        }
      } catch (error) {
        console.error('Failed to fetch exams', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout userType="student">
      <div className="dashboard-page">
        <header className="page-header">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Intellectual Progress</h1>
            <p className="text-secondary">Your current academic standing and recent activities.</p>
          </motion.div>
        </header>

        <div className="stats-grid">
          {[
            { label: 'Exams Available', value: loading ? '...' : exams.length, icon: <BookCheck />, color: 'var(--accent)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="neo-card stat-card"
            >
              <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Priority Examinations</h2>
            <button className="text-btn" onClick={() => navigate('/student/exams')}>View All <ArrowRight size={16} /></button>
          </div>

          <div className="exam-quick-list">
            {loading ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={24} /> Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="neo-card" style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No exams available at the moment. Check back soon!
              </div>
            ) : (
              <>
                {activeTab === 'available' && <AvailableExams />}
                {activeTab === 'results' && <StudentResults />}
                {activeTab === 'interview' && <InterviewPrepHub />}
              </>
            )}
          </div>
        </section>

        <nav className="dashboard-nav">
            <button 
                className={`nav-btn ${activeTab === 'available' ? 'active' : ''}`}
                onClick={() => setActiveTab('available')}
            >
                <BookOpen size={20} />
                Available Exams
            </button>
            <button 
                className={`nav-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
            >
                <FileText size={20} />
                My Results
            </button>
            <button 
                className={`nav-btn ${activeTab === 'interview' ? 'active' : ''}`}
                onClick={() => setActiveTab('interview')}
            >
                <Sparkles size={20} />
                Interview Prep
            </button>
        </nav>

        <style>{`
          .dashboard-page {
            display: flex;
            flex-direction: column;
            gap: 3rem;
          }

          .page-header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
          }

          .stat-card {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1.5rem;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--surface-low);
            border-radius: var(--radius-sm);
          }

          .stat-label {
            display: block;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
          }

          .dashboard-section {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .text-btn {
            background: none;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
          }

          .exam-quick-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .exam-card-horizontal {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            background: var(--surface-low);
          }

          .exam-info h3 {
            margin: 0.5rem 0;
            font-size: 1.5rem;
          }

          .subject-tag {
            font-size: 0.625rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--accent);
            background: var(--accent-soft);
            padding: 0.25rem 0.625rem;
            border-radius: 2px;
          }

          .exam-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 1rem;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-muted);
            font-size: 0.875rem;
          }

          @media (max-width: 768px) {
            .exam-card-horizontal {
              flex-direction: column;
              align-items: flex-start;
              gap: 1.5rem;
            }
            .exam-meta {
              width: 100%;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
