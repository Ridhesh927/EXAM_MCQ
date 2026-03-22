import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getToken } from '../../utils/auth';

interface StudentResultsProps {
    standalone?: boolean;
}

const StudentResults: React.FC<StudentResultsProps> = ({ standalone = true }) => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = getToken('student');
                const response = await fetch('http://localhost:5000/api/exams/student/results', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.results) {
                    setResults(data.results);
                } else {
                    setError(data.message || 'Failed to load results.');
                }
            } catch (err) {
                setError('Could not connect to server.');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const getStatus = (score: number, totalMarks: number, passingMarks: number) => {
        if (score >= totalMarks * 0.75) return { label: 'Distinction', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
        if (score >= totalMarks * 0.6) return { label: 'Merit', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' };
        if (score >= passingMarks) return { label: 'Pass', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' };
        return { label: 'Fail', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const totalExams = results.length;
    const avgScore = totalExams > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.score / r.total_marks) * 100, 0) / totalExams)
        : 0;
    const passCount = results.filter(r => r.score >= r.passing_marks).length;

    const content = (
        <div className="results-page">
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1>My Results</h1>
                    <p className="text-secondary">Your examination performance and history.</p>
                </motion.div>
            </header>

            <div className="stats-grid">
                {[
                    { label: 'Exams Taken', value: totalExams, icon: <BarChart3 />, color: 'var(--accent)' },
                    { label: 'Average Score', value: `${avgScore}%`, icon: <Trophy />, color: '#f59e0b' },
                    { label: 'Passed', value: passCount, icon: <CheckCircle />, color: '#10b981' },
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

            {loading ? (
                <div className="loading-state">
                    <Loader2 className="animate-spin" size={36} />
                    <p>Loading your results...</p>
                </div>
            ) : error ? (
                <div className="error-state">
                    <p>❌ {error}</p>
                </div>
            ) : results.length === 0 ? (
                <div className="empty-state neo-card">
                    <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>No Results Yet</h3>
                    <p>You haven't completed any exams yet. Your results will appear here after you submit an exam.</p>
                </div>
            ) : (
                <div className="results-list">
                    {results.map((result, i) => {
                        const percentage = Math.round((result.score / result.total_marks) * 100);
                        const status = getStatus(result.score, result.total_marks, result.passing_marks);

                        return (
                            <motion.div
                                key={result.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="neo-card result-card"
                            >
                                <div className="result-header">
                                    <div className="result-exam-info">
                                        <span className="exam-subject-tag">{result.exam_subject}</span>
                                        <h3>{result.exam_title}</h3>
                                    </div>
                                    <span className="status-badge" style={{ color: status.color, background: status.bg }}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="result-stats">
                                    <div className="result-stat">
                                        <span className="stat-label">Score</span>
                                        <span className="stat-value-lg">{result.score}/{result.total_marks}</span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="stat-label">Percentage</span>
                                        <span className="stat-value-lg">{percentage}%</span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="stat-label">Correct</span>
                                        <span className="stat-value-lg">
                                            <CheckCircle size={16} style={{ color: '#10b981', marginRight: '0.25rem' }} />
                                            {result.correct_answers}/{result.total_questions}
                                        </span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="stat-label">Time Taken</span>
                                        <span className="stat-value-lg">
                                            <Clock size={16} style={{ marginRight: '0.25rem' }} />
                                            {formatTime(result.completion_time)}
                                        </span>
                                    </div>
                                </div>

                                <div className="score-progress">
                                    <div className="score-bar-bg">
                                        <div
                                            className="score-bar-fill"
                                            style={{
                                                width: `${percentage}%`,
                                                background: percentage >= 75 ? '#10b981' : percentage >= 60 ? '#60a5fa' : percentage >= 35 ? '#a78bfa' : '#ef4444'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="result-footer">
                                    <span className="submitted-at">
                                        Submitted: {new Date(result.submitted_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    <span className="passing-info">
                                        Passing: {result.passing_marks} marks
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .results-page { display: flex; flex-direction: column; gap: 2.5rem; }
                .page-header h1 { font-size: 3rem; margin-bottom: 0.5rem; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                .stat-card { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; }
                .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface-low); border-radius: var(--radius-sm); }
                .stat-label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
                .results-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .result-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; border: 1px solid var(--border); transition: var(--transition-normal); }
                .result-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); }
                .result-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .exam-subject-tag { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: var(--accent); padding: 0.2rem 0.5rem; border: 1px solid var(--accent); border-radius: 3px; display: inline-block; margin-bottom: 0.5rem; }
                .result-exam-info h3 { font-size: 1.375rem; margin: 0; }
                .status-badge { padding: 0.375rem 1rem; border-radius: 20px; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.03em; flex-shrink: 0; }
                .result-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                .result-stat { background: var(--surface-low); padding: 1rem; border-radius: var(--radius-sm); text-align: center; }
                .stat-value-lg { display: flex; align-items: center; justify-content: center; font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-top: 0.25rem; }
                .score-progress { width: 100%; }
                .score-bar-bg { width: 100%; height: 8px; background: var(--surface-high); border-radius: 4px; overflow: hidden; }
                .score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
                .result-footer { display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--text-muted); }
                .loading-state, .error-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--text-muted); }
                .error-state { color: #ef4444; }
                .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
                .empty-state h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary); }
            `}</style>
        </div>
    );

    return standalone ? (
        <DashboardLayout userType="student">{content}</DashboardLayout>
    ) : content;
};

export default StudentResults;
