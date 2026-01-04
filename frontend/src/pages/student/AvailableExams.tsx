import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { MOCK_EXAMS } from '../../utils/mockData';
import { useNavigate } from 'react-router-dom';

const AvailableExams = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout userType="student">
            <div className="exams-page">
                <header className="page-header">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1>Available Assessments</h1>
                        <p className="text-secondary">Current academic challenges awaiting your participation.</p>
                    </motion.div>
                </header>

                <div className="exams-grid">
                    {MOCK_EXAMS.map((exam, i) => (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="neo-card exam-card"
                        >
                            <div className="exam-card-header">
                                <span className={`difficulty-indicator ${exam.difficulty.toLowerCase()}`}>
                                    {exam.difficulty}
                                </span>
                                <div className="marks-badge">
                                    <span>Total Marks</span>
                                    <strong>{exam.marks}</strong>
                                </div>
                            </div>

                            <div className="exam-card-body">
                                <span className="subject-label">{exam.subject}</span>
                                <h3>{exam.title}</h3>
                                <p className="text-secondary">{exam.description}</p>
                            </div>

                            <div className="exam-card-footer">
                                <div className="duration">
                                    <Clock size={16} />
                                    <span>{exam.duration} Minutes</span>
                                </div>
                                <button
                                    className="begin-btn"
                                    onClick={() => navigate(`/student/exam/${exam.id}`)}
                                >
                                    Enter session <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style>{`
                    .exams-page {
                        display: flex;
                        flex-direction: column;
                        gap: 3rem;
                    }

                    .page-header h1 {
                        font-size: 3rem;
                        margin-bottom: 0.5rem;
                    }

                    .exams-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                        gap: 2rem;
                    }

                    .exam-card {
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                        transition: var(--transition-normal);
                        border: 1px solid var(--border);
                    }

                    .exam-card:hover {
                        border-color: var(--accent);
                        transform: translateY(-4px);
                        box-shadow: 0 12px 24px rgba(0,0,0,0.2);
                    }

                    .exam-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .difficulty-indicator {
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        font-weight: 700;
                        padding: 0.25rem 0.5rem;
                        border: 1px solid var(--border);
                        border-radius: 4px;
                    }

                    .difficulty-indicator.hard { color: var(--error); border-color: var(--error); }
                    .difficulty-indicator.medium { color: var(--accent); border-color: var(--accent); }
                    .difficulty-indicator.easy { color: var(--success); border-color: var(--success); }

                    .marks-badge {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }

                    .marks-badge span { font-size: 0.625rem; text-transform: uppercase; color: var(--text-muted); }
                    .marks-badge strong { font-family: var(--font-display); color: var(--accent); }

                    .subject-label {
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: var(--accent);
                        text-transform: uppercase;
                        margin-bottom: 0.5rem;
                        display: block;
                    }

                    .exam-card-body h3 {
                        font-size: 1.5rem;
                        margin-bottom: 0.75rem;
                    }

                    .exam-card-body p {
                        font-size: 0.875rem;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .exam-card-footer {
                        margin-top: auto;
                        padding-top: 1.5rem;
                        border-top: 1px solid var(--border);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .duration {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                    }

                    .begin-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: var(--accent);
                        font-weight: 700;
                        background: none;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        transition: var(--transition-fast);
                    }

                    .begin-btn:hover {
                        background: var(--surface-high);
                        padding-right: 1.25rem;
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
};

export default AvailableExams;
