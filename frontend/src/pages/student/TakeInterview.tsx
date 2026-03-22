import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Flag, Code2, Trophy } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import ConfirmModal from '../../components/ConfirmModal';
import './TakeInterview.css';

interface Question {
    id: number;
    question: string;
    options: string[];
}

interface Interview {
    id: number;
    job_role_target: string;
    total_score: number;
    ai_feedback: string | null;
}

const TakeInterview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [interview, setInterview] = useState<Interview | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Transition state after MCQ submission
    const [transitionData, setTransitionData] = useState<{ score: number; codingId: number | null } | null>(null);

    useEffect(() => {
        fetchInterviewData();
    }, [id]);

    const fetchInterviewData = async () => {
        try {
            const response = await apiFetch(`/api/interview/${id}`);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message || 'Failed to load interview');
            
            setInterview(data.interview);
            setQuestions(data.questions || []);
            
            // If it's already graded, redirect to results
            if (data.interview.ai_feedback !== null) {
                navigate(`/student/interview/result/${id}`, { replace: true });
            }
        } catch (error) {
            console.error("Failed to load interview", error);
            alert("Could not load interview details.");
            navigate('/student/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (option: string) => {
        const qId = questions[currentQuestionIdx].id;
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const toggleMarkForReview = () => {
        const qId = questions[currentQuestionIdx].id;
        setMarkedForReview(prev => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId); else next.add(qId);
            return next;
        });
    };

    const handleNext = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await apiFetch(`/api/interview/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Submission failed.');

            // Show transition overlay instead of immediately navigating
            setTransitionData({ score: data.score, codingId: data.codingId || null });
        } catch (error: any) {
            alert(error.message || 'Submission failed.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="interview-loading">
                <Loader2 className="animate-spin text-accent" size={48} />
                <p>Loading your personalized interview...</p>
            </div>
        );
    }

    // ─── Transition Overlay after MCQ Submission ───────────────────────────────
    if (transitionData) {
        const tier = transitionData.score >= 70 ? 'pass' : 'needs-work';
        return (
            <motion.div
                className="interview-transition-overlay"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="transition-card">
                    <div className={`transition-score-ring ${tier}`}>
                        <Trophy size={28} />
                        <span>{transitionData.score}%</span>
                    </div>
                    <h2>Part 1 Complete!</h2>
                    <p className="transition-desc">
                        You scored <strong>{transitionData.score}%</strong> on the Theory (MCQ) Round.
                        {transitionData.codingId 
                            ? " Now it's time to put your coding skills to the test!" 
                            : " View your detailed results below."}
                    </p>

                    {transitionData.codingId && (
                        <div className="transition-next-info">
                            <Code2 size={18} />
                            <span>Part 2: DSA Coding Round — 2 Algorithmic Problems</span>
                        </div>
                    )}

                    <div className="transition-actions">
                        <button
                            className="neo-btn-secondary"
                            onClick={() => navigate(`/student/interview/result/${id}`)}
                        >
                            Skip to MCQ Results
                        </button>
                        {transitionData.codingId && (
                            <button
                                className="neo-btn-primary transition-cta"
                                onClick={() => navigate(`/student/coding/${transitionData.codingId}`)}
                            >
                                <Code2 size={18} /> Start Coding Round <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!interview || questions.length === 0) {
        return <div className="interview-error">Interview not found or has no questions.</div>;
    }

    const currentQ = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / questions.length) * 100;

    return (
        <div className="take-interview-container">
            {/* Header */}
            <header className="interview-header">
                <div>
                    <h1>{interview.job_role_target} Mock Interview</h1>
                    <p>Answer all questions to the best of your ability. The AI will analyze your performance.</p>
                </div>
                <div className="progress-section">
                    <div className="progress-text">
                        <span>Progress</span>
                        <span>{answeredCount} / {questions.length} Answered</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </header>

            <div className="interview-layout">
                {/* Main Question Area */}
                <main className="question-area">
                    <motion.div 
                        key={currentQuestionIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="question-card"
                    >
                        <h2 className="question-number">Question {currentQuestionIdx + 1} of {questions.length}</h2>
                        <h3 className="question-text">{currentQ.question}</h3>
                        
                        <div className="options-list">
                            {currentQ.options.map((opt, index) => {
                                const isSelected = answers[currentQ.id] === opt;
                                return (
                                    <button 
                                        key={index}
                                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelectOption(opt)}
                                    >
                                        <div className="option-indicator">{String.fromCharCode(65 + index)}</div>
                                        <div className="option-text">{opt}</div>
                                        {isSelected && <CheckCircle size={20} className="check-icon" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    <div className="navigation-controls">
                        <button 
                            className="neo-btn-secondary" 
                            onClick={handlePrev} 
                            disabled={currentQuestionIdx === 0}
                        >
                            <ArrowLeft size={18} /> Previous
                        </button>

                        <button
                            className={`mark-review-btn ${markedForReview.has(currentQ.id) ? 'marked' : ''}`}
                            onClick={toggleMarkForReview}
                        >
                            <Flag size={16} />
                            {markedForReview.has(currentQ.id) ? 'Unmark Review' : 'Mark for Review'}
                        </button>
                        
                        {isLastQuestion ? (
                            <button 
                                className="neo-btn-primary submit-pulse" 
                                onClick={() => setShowConfirmModal(true)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Final Interview'}
                            </button>
                        ) : (
                            <button className="neo-btn-primary" onClick={handleNext}>
                                Next <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </main>

                {/* Sidebar Navigation */}
                <aside className="question-nav-sidebar">
                    <h3>Question Map</h3>

                    {[
                        { label: 'DSA', color: '#6366f1', start: 0, end: 5 },
                        { label: 'Logical', color: '#06b6d4', start: 5, end: 10 },
                        { label: 'Verbal', color: '#8b5cf6', start: 10, end: 15 },
                        { label: 'Technical', color: '#d97706', start: 15, end: 20 },
                    ].map(section => (
                        <div key={section.label} className="map-section">
                            <div className="map-section-label" style={{ color: section.color }}>
                                {section.label}
                            </div>
                            <div className="question-grid">
                                {questions.slice(section.start, section.end).map((q, localIdx) => {
                                    const idx = section.start + localIdx;
                                    const isAnswered = !!answers[q.id];
                                    const isReview = markedForReview.has(q.id);
                                    const isActive = currentQuestionIdx === idx;
                                    let statusClass = '';
                                    if (isAnswered) statusClass = 'answered';
                                    if (isReview) statusClass = 'on-hold';
                                    if (isActive) statusClass += ' active';
                                    return (
                                        <button
                                            key={q.id}
                                            className={`nav-dot ${statusClass}`}
                                            onClick={() => setCurrentQuestionIdx(idx)}
                                            title={isAnswered ? 'Answered' : isReview ? 'Marked for Review' : 'Not Answered'}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="map-legend">
                        <div className="legend-item">
                            <span className="legend-dot answered"></span>
                            <span>Answered</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot on-hold"></span>
                            <span>On Hold</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot"></span>
                            <span>Unanswered</span>
                        </div>
                    </div>
                </aside>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleSubmit}
                title="Submit Interview?"
                message="Are you sure you want to completely submit this interview? Your answers will be analyzed by AI."
                confirmText="Yes, Submit"
                type="primary"
            />
        </div>
    );
};

export default TakeInterview;
