import { motion } from 'framer-motion';
import {
    TrendingUp,
    Search,
    ArrowRight,
    Download,
    Filter,
    BarChart3
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ViewResults = () => {
    const results = [
        { id: '1', student: 'Marcus Aurelius', exam: 'Philosophy 101', score: 92, status: 'Distinction' },
        { id: '2', student: 'Seneca The Younger', exam: 'Stoicism Masterclass', score: 88, status: 'Merit' },
        { id: '3', student: 'Epictetus', exam: 'Logic & Reason', score: 95, status: 'Distinction' },
        { id: '4', student: 'Cicero', exam: 'Rhetoric & Law', score: 74, status: 'Pass' },
    ];

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
                        { label: 'Avg. Class Score', value: '84%', icon: <TrendingUp className="text-accent" />, trend: '+3.2%' },
                        { label: 'Completion Rate', value: '98%', icon: <BarChart3 className="text-accent" />, trend: '+0.5%' },
                        { label: 'Distinction Rate', value: '24%', icon: <TrendingUp className="text-accent" />, trend: '+1.8%' },
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
                            {results.map((res) => (
                                <tr key={res.id}>
                                    <td>
                                        <div className="student-profile">
                                            <div className="avatar-small">{res.student[0]}</div>
                                            <span>{res.student}</span>
                                        </div>
                                    </td>
                                    <td>{res.exam}</td>
                                    <td className="score-cell">
                                        <div className="score-bar-bg">
                                            <div className="score-bar-fill" style={{ width: `${res.score}%` }}></div>
                                        </div>
                                        <span>{res.score}%</span>
                                    </td>
                                    <td>
                                        <span className={`status-tag ${res.status.toLowerCase()}`}>{res.status}</span>
                                    </td>
                                    <td>
                                        <button className="icon-btn-text">View Scripts <ArrowRight size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
