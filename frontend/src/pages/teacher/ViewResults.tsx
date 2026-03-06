import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Search,
    ArrowRight,
    Download,
    Filter,
    BarChart3,
    Loader2
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ViewResults = () => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgScore: 0, completionRate: 0, distinctionRate: 0 });

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await apiFetch('/api/exams/teacher/results');
            const data = await response.json();
            if (data.results) {
                setResults(data.results);
                calculateStats(data.results);
            }
        } catch (error) {
            console.error('Failed to fetch results', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        if (data.length === 0) return;

        const totalScore = data.reduce((acc, curr) => acc + (curr.score / curr.total_questions * 100), 0);
        const avgScore = Math.round(totalScore / data.length);

        const distinctionCount = data.filter(r => (r.score / r.total_questions) >= 0.75).length;
        const distinctionRate = Math.round((distinctionCount / data.length) * 100);

        setStats({
            avgScore,
            completionRate: 98, // Mocked for now (needs exam session data)
            distinctionRate
        });
    };

    const getStatus = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage >= 75) return 'Distinction';
        if (percentage >= 60) return 'Merit';
        if (percentage >= 35) return 'Pass';
        return 'Fail';
    };

    return (
        <DashboardLayout userType="teacher">
            <div className="results-page">
                <header className="page-header">
                    <div className="title-area">
                        <h1>Scholastic Analytics</h1>
                        <p className="text-secondary">Analyze student performance across all assessments.</p>
                    </div>
                    <div className="header-actions">
                        <button className="neo-btn-secondary"><Download size={18} /> Export CSV</button>
                        <button className="neo-btn-primary">Generate PDF Report</button>
                    </div>
                </header>

                <div className="analytics-overview">
                    {[
                        { label: 'Avg. Class Score', value: `${stats.avgScore}%`, icon: <TrendingUp className="text-accent" />, trend: 'N/A' },
                        { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: <BarChart3 className="text-accent" />, trend: 'N/A' },
                        { label: 'Distinction Rate', value: `${stats.distinctionRate}%`, icon: <TrendingUp className="text-accent" />, trend: 'N/A' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="stat-card neo-card"
                        >
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <div className="stat-value-group">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-trend">{stat.trend}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="results-explorer neo-card">
                    <div className="explorer-header">
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Search by student or exam..." />
                        </div>
                        <button className="neo-btn-secondary"><Filter size={18} /> Filters</button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <p>Loading results...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="empty-state">
                            <p>No results found.</p>
                        </div>
                    ) : (
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Scholar Identity</th>
                                    <th>Assessment Module</th>
                                    <th>Result Percentage</th>
                                    <th>Status Mapping</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res) => {
                                    const percentage = Math.round((res.score / res.total_questions) * 100);
                                    const status = getStatus(res.score, res.total_questions);

                                    return (
                                        <tr key={res.id}>
                                            <td>
                                                <div className="student-profile">
                                                    <div className="avatar-small">{res.student_name.charAt(0).toUpperCase()}</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{res.student_name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.student_email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{res.exam_title}</td>
                                            <td className="score-cell">
                                                <div className="score-bar-bg">
                                                    <div className="score-bar-fill" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <span>{percentage}%</span>
                                            </td>
                                            <td>
                                                <span className={`status-tag ${status.toLowerCase()}`}>{status}</span>
                                            </td>
                                            <td>
                                                <button className="icon-btn-text">View Scripts <ArrowRight size={14} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <style>{`
          .results-page { display: flex; flex-direction: column; gap: 2.5rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; }
          .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
          
          .analytics-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
          .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; }
          .stat-icon { width: 48px; height: 48px; background: var(--surface-high); display: flex; align-items: center; justify-content: center; border-radius: 12px; }
          .stat-label { font-size: 0.8125rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
          .stat-value-group { display: flex; align-items: baseline; gap: 0.75rem; margin-top: 0.25rem; }
          .stat-value { font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); }
          .stat-trend { font-size: 0.75rem; color: #10b981; font-weight: 600; }
          
          .results-explorer { padding: 0; overflow: hidden; }
          .explorer-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
          .search-box { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); flex: 1; max-width: 400px; }
          .search-box input { background: none; color: var(--text-primary); width: 100%; border: none; outline: none; }
          
          .results-table { width: 100%; border-collapse: collapse; }
          .results-table th { text-align: left; padding: 1.25rem 2rem; background: var(--surface-low); font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
          .results-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); font-size: 0.9375rem; }
          
          .student-profile { display: flex; align-items: center; gap: 1rem; }
          .avatar-small { width: 32px; height: 32px; background: var(--surface-high); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--accent); }
          
          .score-cell { display: flex; align-items: center; gap: 1rem; }
          .score-bar-bg { flex: 1; max-width: 100px; height: 6px; background: var(--surface-high); border-radius: 3px; overflow: hidden; }
          .score-bar-fill { height: 100%; background: var(--accent); }
          
          .status-tag { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
          .status-tag.distinction { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .status-tag.merit { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
          .status-tag.pass { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
          
          .icon-btn-text { background: none; color: var(--accent); font-size: 0.8125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition-fast); }
          .icon-btn-text:hover { gap: 0.75rem; }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ViewResults;
