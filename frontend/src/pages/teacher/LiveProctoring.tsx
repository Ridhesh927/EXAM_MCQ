import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
    Users,
    ShieldAlert,
    Search,
    Filter,
    Monitor,
    Video,
    VideoOff,
    ExternalLink
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

interface StudentSession {
    id: number;
    student_id: number;
    student_name: string;
    prn_number: string;
    warnings_count: number;
    status: string;
    last_update?: string;
    last_action?: string;
}

const LiveProctoring = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [sessions, setSessions] = useState<StudentSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await axios.get('/api/exams/teacher/my-exams');
                setExams(res.data);
                if (res.data.length > 0) setSelectedExamId(res.data[0].id);
            } catch (err) {
                console.error("Failed to fetch exams", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    useEffect(() => {
        if (!selectedExamId) return;

        const fetchSessions = async () => {
            try {
                const res = await axios.get(`/api/exams/teacher/active-sessions/${selectedExamId}`);
                setSessions(res.data);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            }
        };

        fetchSessions();

        const socket = io();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        socket.emit('join-room', {
            examId: selectedExamId,
            userId: user.id || 0,
            role: 'teacher',
            name: user.name || 'Teacher'
        });

        socket.on('student-connected', (data) => {
            console.log("Student joined:", data);
            fetchSessions(); // Refresh list
        });

        socket.on('student-warning-alert', (data) => {
            console.log("Warning received:", data);
            setSessions(prev => prev.map(s =>
                s.id === data.sessionId ? { ...s, warnings_count: s.warnings_count + 1, last_action: data.warningType } : s
            ));
        });

        socket.on('student-progress-update', (data) => {
            setSessions(prev => prev.map(s =>
                s.id === data.sessionId ? { ...s, last_action: `Answered Q${data.questionId}`, last_update: new Date().toLocaleTimeString() } : s
            ));
        });

        socket.on('student-disconnected', (data) => {
            setSessions(prev => prev.filter(s => s.student_id !== data.userId));
        });

        return () => {
            socket.disconnect();
        };
    }, [selectedExamId]);

    const getStatusType = (warnings: number) => {
        if (warnings >= 3) return 'critical';
        if (warnings > 0) return 'warning';
        return 'secure';
    };

    return (
        <DashboardLayout userType="teacher">
            <div className="proctoring-page">
                <header className="page-header">
                    <div className="header-meta">
                        <h1>Live Invigilation</h1>
                        <div className="active-stats">
                            <div className="stat"><Users size={16} /> {sessions.length} Active</div>
                            <div className="stat warn"><ShieldAlert size={16} /> {sessions.filter(s => s.warnings_count > 0).length} Flagged</div>
                        </div>
                    </div>

                    <div className="header-filters">
                        <select
                            className="neo-select"
                            value={selectedExamId || ''}
                            onChange={(e) => setSelectedExamId(Number(e.target.value))}
                            style={{ padding: '0.6rem 1rem', background: 'var(--surface-low)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                        >
                            <option value="" disabled>Select Exam to Monitor</option>
                            {exams.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.title}</option>
                            ))}
                        </select>
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Filter by Name or PRN..." />
                        </div>
                    </div>
                </header>

                <div className="monitoring-grid">
                    {sessions.length === 0 && !loading && (
                        <div className="no-sessions neo-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>No active sessions found for this exam</h3>
                            <p>Waiting for students to join...</p>
                        </div>
                    )}
                    {sessions.map((session, i) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`proctor-feed neo-card ${getStatusType(session.warnings_count)}`}
                        >
                            <div className="feed-video">
                                <div className="video-placeholder">
                                    {session.warnings_count >= 3 ? <VideoOff size={48} /> : <Video size={48} />}
                                </div>
                                <div className="feed-overlay">
                                    <span className="device-tag"><Monitor size={12} /> Live</span>
                                    <span className="focus-tag">Warnings: {session.warnings_count}/3</span>
                                </div>
                            </div>

                            <div className="feed-info">
                                <div className="student-brief">
                                    <span className="student-name">{session.student_name}</span>
                                    <span className="status-label">{getStatusType(session.warnings_count)}</span>
                                </div>
                                <div className="last-action" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {session.last_action || 'Session Active'} {session.last_update && `at ${session.last_update}`}
                                </div>
                                <div className="feed-actions">
                                    <button className="small-btn">View Log</button>
                                    <button className="small-btn warn">Suspend</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style>{`
          .proctoring-page { display: flex; flex-direction: column; gap: 2.5rem; }
          .page-header { display: flex; align-items: center; justify-content: space-between; }
          .header-meta h1 { font-size: 2.25rem; margin-bottom: 0.5rem; font-family: var(--font-display); }
          .active-stats { display: flex; gap: 1.5rem; font-size: 0.8125rem; font-weight: 700; }
          .stat { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); }
          .stat.warn { color: var(--error); }
          
          .header-filters { display: flex; gap: 1rem; }
          .search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: var(--surface-low); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.875rem; }
          .search-box input { background: none; color: var(--text-primary); border: none; outline: none; }
          .icon-btn-outline { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: none; color: var(--text-secondary); }

          .monitoring-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
            gap: 1.5rem; 
            padding-bottom: 2rem;
          }
          .proctor-feed { 
            padding: 0.75rem; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            border: 2px solid transparent !important;
            background: var(--surface-low);
            transition: var(--transition-normal);
          }
          .proctor-feed.warning { border-color: var(--accent) !important; }
          .proctor-feed.critical { border-color: var(--error) !important; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
          
          .feed-video { position: relative; aspect-ratio: 16/9; background: #0c0c0d; border-radius: 4px; overflow: hidden; }
          .video-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--surface); opacity: 0.3; }
          .feed-overlay { position: absolute; top: 0; left: 0; right: 0; padding: 0.75rem; display: flex; justify-content: space-between; background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent); }
          .device-tag, .focus-tag { font-size: 0.625rem; font-weight: 700; color: #fff; text-transform: uppercase; background: rgba(0,0,0,0.5); padding: 0.2rem 0.4rem; border-radius: 2px; display: flex; align-items: center; gap: 0.25rem; }
          
          .feed-info { display: flex; flex-direction: column; gap: 1rem; }
          .student-brief { display: flex; justify-content: space-between; align-items: center; }
          .student-name { font-weight: 700; font-size: 0.9375rem; color: var(--text-primary); }
          .status-label { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: 2px; background: var(--surface-high); }
          .critical .status-label { color: var(--error); background: rgba(239, 68, 68, 0.1); }
          .warning .status-label { color: var(--accent); background: rgba(255, 171, 0, 0.1); }
          .secure .status-label { color: var(--success); background: rgba(16, 185, 129, 0.1); }
          
          .feed-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .small-btn { padding: 0.6rem; font-size: 0.75rem; font-weight: 700; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); border-radius: 4px; transition: var(--transition-fast); }
          .small-btn:hover { background: var(--surface-high); color: var(--text-primary); }
          .small-btn.warn { background: var(--error); color: #fff; border: none; }
          .small-btn.warn:hover { opacity: 0.9; }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default LiveProctoring;
