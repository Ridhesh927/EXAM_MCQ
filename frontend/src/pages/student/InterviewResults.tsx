import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle, XCircle, BrainCircuit, ArrowRight, ClipboardCheck, Download, Code2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './InterviewResults.css';

interface Question {
    id: number;
    question: string;
    options: string[];
    correct_answer: string;
    student_answer: string | null;
    explanation: string;
}

interface Interview {
    id: number;
    job_role_target: string;
    total_score: number;
    ai_feedback: string;
    created_at: string;
}

const InterviewResults = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [interview, setInterview] = useState<Interview | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [codingRound, setCodingRound] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showDetailed, setShowDetailed] = useState(false);

    const handleDownload = () => {
        if (!interview) return;
        const { job_role_target, total_score, ai_feedback, created_at } = interview;
        const date = new Date(created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

        const questionHTML = questions.map((q, idx) => {
            const isCorrect = (q.student_answer?.trim().toLowerCase() || '') === (q.correct_answer?.trim().toLowerCase() || '');
            const optionsHTML = q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isCorrOpt = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                const isStudOpt = opt.trim().toLowerCase() === (q.student_answer || '').trim().toLowerCase();
                let style = '';
                if (isCorrOpt) style = 'color:#16a34a;font-weight:600;';
                if (isStudOpt && !isCorrect) style = 'color:#dc2626;font-weight:600;';
                return `<div style="padding:3px 0;${style}">${letter}. ${opt}${isCorrOpt ? ' ✓' : ''}${isStudOpt && !isCorrect ? ' ✗' : ''}</div>`;
            }).join('');
            return `
            <div style="margin-bottom:18px;padding:14px;border:1px solid ${isCorrect ? '#22c55e' : '#ef4444'};border-radius:8px;background:${isCorrect ? '#f0fdf4' : '#fff5f5'}">
                <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:6px">Q${idx + 1} — ${isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>
                <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#1a1a1a">${q.question}</div>
                <div style="font-size:13px;margin-bottom:10px">${optionsHTML}</div>
                ${!isCorrect ? `<div style="font-size:12px;color:#6b7280;margin-bottom:6px">Your answer: <span style="color:#dc2626">${q.student_answer || 'Not Answered'}</span></div>` : ''}
                ${q.explanation ? `<div style="font-size:12px;background:#f8fafc;border-left:3px solid #6366f1;padding:8px 10px;border-radius:4px;color:#374151"><strong>💡 Explanation:</strong> ${q.explanation}</div>` : ''}
            </div>`;
        }).join('');

        const codingHTML = codingRound ? `
            <div style="margin-top:30px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <h2 style="font-size:18px;color:#6366f1;margin-bottom:12px;border-bottom:2px solid #6366f1;padding-bottom:5px;">Part 2: Coding Round Evaluation</h2>
                <div style="font-size:14px;margin-bottom:10px;">Score: <strong>${codingRound.total_score}/100</strong> | Language: <strong>${codingRound.language}</strong></div>
                <div style="font-size:13px;color:#334155;line-height:1.6;white-space:pre-line;">${codingRound.ai_feedback}</div>
            </div>
        ` : '';

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Interview Review — ${job_role_target}</title>
        <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:30px;color:#1a1a1a;} @media print{@page{margin:20mm;}}</style>
        </head><body>
        <h1 style="font-size:22px;margin-bottom:4px">${job_role_target} — Interview Review</h1>
        <p style="color:#6b7280;font-size:13px;margin-bottom:4px">Date: ${date} &nbsp;|&nbsp; Combined Score: <strong>${codingRound ? Math.round((total_score + codingRound.total_score) / 2) : total_score}%</strong></p>
        <hr style="margin:16px 0;border-color:#e5e7eb">
        <h2 style="font-size:16px;margin-bottom:10px">📋 MCQ Round Feedback (Part 1)</h2>
        <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-line">${ai_feedback}</div>
        <div style="margin-top:20px;">${questionHTML}</div>
        ${codingHTML}
        </body></html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await apiFetch(`/api/interview/${id}`);
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.message || 'Failed to load results');
                
                setInterview(data.interview);
                setQuestions(data.questions || []);
                setCodingRound(data.codingRound || null);
            } catch (error) {
                console.error("Failed to load interview results", error);
                alert("Could not load interview results.");
                navigate('/student/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="results-loading">
                <Loader2 className="animate-spin text-accent" size={48} />
                <p>Retrieving AI Feedback Report...</p>
            </div>
        );
    }

    if (!interview || !interview.ai_feedback) {
        return (
            <div className="results-container">
                <h2>No Feedback Available</h2>
                <p>This interview might not have been submitted yet.</p>
                <button className="neo-btn-primary mt-4" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>
        );
    }

    const { total_score, job_role_target, ai_feedback } = interview;
    // Format text paragraphs from AI
    const feedbackParagraphs = ai_feedback.split('\n').filter(p => p.trim() !== '');

    return (
        <motion.div 
            className="results-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <button className="neo-btn-secondary back-btn" onClick={() => navigate('/student/dashboard')}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <header className="results-header">
                <div>
                    <h1>{showDetailed ? 'Detailed Answer Review' : 'AI Performance Report'}</h1>
                    <p className="text-muted">
                        {showDetailed 
                            ? `In-depth breakdown for your ${job_role_target} interview.`
                            : `Personalized feedback for your ${job_role_target} interview.`}
                    </p>
                </div>
                <div className={`score-badge ${total_score >= 70 ? 'success' : 'warning'}`}>
                    <span className="score-value">{total_score}%</span>
                    <span className="score-label">Overall Score</span>
                </div>
            </header>

            <div className="results-content-wrapper">
                {!showDetailed ? (
                    /* Step 1: AI Feedback Only */
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="feedback-only-view"
                    >
                        {/* Overall Score Summary */}
                        <div className="unified-score-summary card glass-card mb-6">
                            <div className="unified-score-header">
                                <ClipboardCheck size={24} className="text-accent" />
                                <h2>Combined Scorecard</h2>
                            </div>
                            <div className="unified-score-grid">
                                <div className="score-item">
                                    <span className="label">MCQ Round (Part 1)</span>
                                    <span className="value">{total_score}%</span>
                                </div>
                                {codingRound && (
                                    <div className="score-item">
                                        <span className="label">Coding Round (Part 2)</span>
                                        <span className="value">{codingRound.total_score}%</span>
                                    </div>
                                )}
                                {codingRound && (
                                    <div className="score-item total">
                                        <span className="label">Final Interview Score</span>
                                        <span className="value">{Math.round((total_score + codingRound.total_score) / 2)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MCQ Feedback */}
                        <div className="feedback-section card glass-card mb-6">
                            <div className="feedback-title">
                                <BrainCircuit size={28} className="text-accent" />
                                <h2>Part 1: MCQ Feedback</h2>
                            </div>
                            <div className="feedback-body">
                                {feedbackParagraphs.map((para, i) => (
                                    <p key={i} className="feedback-para">{para}</p>
                                ))}
                            </div>
                        </div>

                        {/* Coding Feedback */}
                        {codingRound && codingRound.ai_feedback && (
                            <div className="feedback-section card glass-card">
                                <div className="feedback-title">
                                    <Code2 size={28} className="text-secondary" />
                                    <h2>Part 2: Coding Feedback</h2>
                                </div>
                                <div className="feedback-body coding-feedback">
                                    {codingRound.ai_feedback.split('\n').map((para: string, i: number) => (
                                        <p key={i} className="feedback-para">{para}</p>
                                    ))}
                                </div>
                                <div className="coding-meta mt-4 p-3 bg-low border-t">
                                    <span>Language used: <strong>{codingRound.language}</strong></span>
                                </div>
                            </div>
                        )}

                        <div className="view-actions mt-8">
                            <button 
                                className="neo-btn-primary explore-btn" 
                                onClick={() => setShowDetailed(true)}
                            >
                                <ClipboardCheck size={20} /> Review Detailed Answers <ArrowRight size={18} />
                            </button>
                            <button className="neo-btn-secondary" onClick={handleDownload}>
                                <Download size={16} /> Download Full Report
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Step 2: Question Breakdown */
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="breakdown-only-view"
                    >
                        <div className="breakdown-header-actions">
                            <button className="text-link-btn" onClick={() => setShowDetailed(false)}>
                                <ArrowLeft size={16} /> Back to AI Feedback
                            </button>
                        </div>

                        <div className="questions-review-list">
                            {questions.map((q, idx) => {
                                const isCorrect = (q.student_answer?.trim().toLowerCase() || '') === (q.correct_answer?.trim().toLowerCase() || '');
                                
                                return (
                                    <div key={q.id} className={`review-card ${isCorrect ? 'correct-bg' : 'wrong-bg'}`}>
                                        <div className="review-card-header">
                                            <span className="q-number">Question {idx + 1}</span>
                                            {isCorrect ? (
                                                <span className="status-badge success-badge"><CheckCircle size={16}/> Correct</span>
                                            ) : (
                                                <span className="status-badge error-badge"><XCircle size={16}/> Incorrect</span>
                                            )}
                                        </div>
                                        <h4 className="q-text">{q.question}</h4>
                                        
                                        <div className="answers-comparison">
                                            <div className="answer-row">
                                                <span className="label">Your Choice:</span>
                                                <span className={`answer-text ${isCorrect ? 'text-success' : 'text-error'}`}>
                                                    {q.student_answer || <em>Not Answered</em>}
                                                </span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="answer-row">
                                                    <span className="label">Correct Model Answer:</span>
                                                    <span className="answer-text text-success">{q.correct_answer}</span>
                                                </div>
                                            )}
                                        </div>

                                        {q.explanation && (
                                            <div className="explanation-box">
                                                <div className="expl-header"><BrainCircuit size={14} /> AI Explanation</div>
                                                <p>{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="view-actions footer-actions">
                           <button className="neo-btn-secondary" onClick={() => navigate('/student/dashboard')}>
                               Finish Review
                           </button>
                           <button className="neo-btn-primary" onClick={handleDownload}>
                               <Download size={16} /> Download Report
                           </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default InterviewResults;
