import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CheckCircle2, MoreHorizontal } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { DashboardStatsSkeleton } from '../../components/Skeleton';

const TeacherDashboard = () => {
    const [stats, setStats] = useState({
        totalExams: 0,
        activeSessions: 0,
        recentResults: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await apiFetch('/api/exams/teacher/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout userType="teacher">
            <div className="dashboard-page">
                <header className="page-header">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1>Course Overview</h1>
                        <p className="text-secondary">Administrative console for proctoring and curriculum management.</p>
                    </motion.div>
                </header>

                {loading ? (
                    <DashboardStatsSkeleton />
                ) : (
                    <div className="stats-grid">
                        {[
                            { label: 'Total Exams', value: stats.totalExams, icon: <FileText />, color: 'var(--accent)' },
                            { label: 'Active Sessions', value: stats.activeSessions, icon: <Users />, color: 'var(--accent)' },
                            { label: 'Completed Today', value: '-', icon: <CheckCircle2 />, color: 'var(--success)' },
                            { label: 'Pending Reviews', value: '-', icon: <MoreHorizontal />, color: 'var(--accent)' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
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
                )}

                {/* ... More sections could go here ... */}

                <style>{`
          .dashboard-page { display: flex; flex-direction: column; gap: 3rem; }
          .page-header h1 { font-size: 3rem; margin-bottom: 0.5rem; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
          .stat-card { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; }
          .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface-low); border-radius: var(--radius-sm); }
          .stat-label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.25rem; }
          .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;
