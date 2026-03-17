import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInterviewData();
    }, [id]);

    const fetchInterviewData = async () => {
        try {
            const data = await apiFetch(`/api/interview/${id}`);
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
        if (!window.confirm("Are you sure you want to completely submit this interview?")) return;
        
        setIsSubmitting(true);
        try {
            await apiFetch(`/api/interview/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers })
            });
            // Go to results page
            navigate(`/student/interview/result/${id}`);
        } catch (error: any) {
            alert(error.message || "Submission failed.");
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
                        
                        {isLastQuestion ? (
                            <button 
                                className="neo-btn-primary submit-pulse" 
                                onClick={handleSubmit}
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
                    <div className="question-grid">
                        {questions.map((q, idx) => {
                            const isAnswered = !!answers[q.id];
                            const isActive = currentQuestionIdx === idx;
                            return (
                                <button 
                                    key={q.id}
                                    className={`nav-dot ${isAnswered ? 'answered' : ''} ${isActive ? 'active' : ''}`}
                                    onClick={() => setCurrentQuestionIdx(idx)}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TakeInterview;
