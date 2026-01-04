import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle,
    Settings,
    CheckCircle,
    Plus,
    Trash2,
    Upload,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const CreateExam = () => {
    const [step, setStep] = useState(1);
    const [examData, setExamData] = useState({
        title: '',
        subject: '',
        duration: 60,
        passingMarks: 40,
        questions: [] as any[]
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const addQuestion = () => {
        setExamData({
            ...examData,
            questions: [...examData.questions, { text: '', type: 'MCQ', options: ['', '', '', ''], correct: 0 }]
        });
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updatedQuestions = [...examData.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setExamData({ ...examData, questions: updatedQuestions });
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const updatedQuestions = [...examData.questions];
        const updatedOptions = [...updatedQuestions[qIndex].options];
        updatedOptions[oIndex] = value;
        updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
        setExamData({ ...examData, questions: updatedQuestions });
    };

    const deleteQuestion = (index: number) => {
        setExamData({
            ...examData,
            questions: examData.questions.filter((_, i) => i !== index)
        });
    };

    return (
        <DashboardLayout userType="teacher">
            <div className="create-exam-page">
                <header className="page-header">
                    <div>
                        <h1>Drafting New Assessment</h1>
                        <p className="text-secondary">Structure your inquiry with precision and clarity.</p>
                    </div>
                    <div className="step-indicator">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`step-dot ${step >= i ? 'active' : ''}`}>
                                <span className="step-num">{i}</span>
                                <span className="step-label">{i === 1 ? 'Foundations' : i === 2 ? 'Inquiry' : 'Finalize'}</span>
                            </div>
                        ))}
                    </div>
                </header>

                <main className="wizard-container neo-card">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="wizard-step"
                            >
                                <div className="section-title">
                                    <Settings className="text-accent" />
                                    <h2>Exam Foundations</h2>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group span-2">
                                        <label>Title of Assessment</label>
                                        <input
                                            type="text"
                                            className="neo-input"
                                            placeholder="e.g. Quantum Mechanics Midterm"
                                            value={examData.title}
                                            onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Discipline / Subject</label>
                                        <input
                                            type="text"
                                            className="neo-input"
                                            placeholder="Physics"
                                            value={examData.subject}
                                            onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            className="neo-input"
                                            value={examData.duration}
                                            onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="wizard-step"
                            >
                                <div className="section-title">
                                    <HelpCircle className="text-accent" />
                                    <h2>Inquiry Design</h2>
                                </div>

                                <div className="questions-list">
                                    {examData.questions.map((q, i) => (
                                        <div key={i} className="question-editor neo-card">
                                            <div className="q-edit-header">
                                                <span>Question {i + 1}</span>
                                                <button onClick={() => deleteQuestion(i)} className="text-btn danger"><Trash2 size={16} /></button>
                                            </div>
                                            <textarea
                                                className="neo-input q-text-area"
                                                placeholder="Enter question text..."
                                                value={q.text}
                                                onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                                            ></textarea>

                                            <div className="options-grid">
                                                {q.options.map((opt: string, oIdx: number) => (
                                                    <div
                                                        key={oIdx}
                                                        className={`option-row ${q.correct === oIdx ? 'correct' : ''}`}
                                                    >
                                                        <button
                                                            className="correct-toggle"
                                                            onClick={() => updateQuestion(i, 'correct', oIdx)}
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            className="neo-input-compact"
                                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                            value={opt}
                                                            onChange={(e) => updateOption(i, oIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <button className="add-q-btn" onClick={addQuestion}>
                                        <Plus size={20} /> Add New Inquiry
                                    </button>

                                    <div className="bulk-import-lite">
                                        <Upload size={18} />
                                        <span>Or import questions from CSV/Excel template</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="wizard-step finalize-step"
                            >
                                <CheckCircle size={64} className="text-success" />
                                <h2>Validation Complete</h2>
                                <p className="text-secondary text-center">Your assessment is structured and ready for enrollment. Perform a final review before publication.</p>

                                <div className="review-summary neo-card">
                                    <div className="r-item"><span>Title</span> <strong>{examData.title || 'Untitled'}</strong></div>
                                    <div className="r-item"><span>Subject</span> <strong>{examData.subject || 'Not specified'}</strong></div>
                                    <div className="r-item"><span>Questions</span> <strong>{examData.questions.length}</strong></div>
                                    <div className="r-item"><span>Security</span> <strong className="text-success">AI Proctoring Enabled</strong></div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <footer className="wizard-footer">
                        <button
                            disabled={step === 1}
                            onClick={prevStep}
                            className="text-btn"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                        <button
                            onClick={step === 3 ? () => { } : nextStep}
                            className="neo-btn-primary"
                        >
                            {step === 3 ? 'Publish Assessment' : 'Continue'} <ChevronRight size={18} />
                        </button>
                    </footer>
                </main>

                <style>{`
          .create-exam-page { display: flex; flex-direction: column; gap: 2.5rem; max-width: 1000px; margin: 0 auto; }
          .page-header { display: flex; align-items: center; justify-content: space-between; }
          .page-header h1 { font-size: 2.25rem; font-family: var(--font-display); }
          .step-indicator { display: flex; gap: 2rem; }
          .step-dot { display: flex; align-items: center; gap: 0.75rem; opacity: 0.3; transition: var(--transition-normal); }
          .step-dot.active { opacity: 1; color: var(--accent); }
          .step-num { width: 24px; height: 24px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; }
          .step-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          
          .wizard-container { padding: 3rem; display: flex; flex-direction: column; gap: 2rem; min-height: 500px; background: var(--surface-low); }
          .section-title { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
          .section-title h2 { font-size: 1.5rem; }
          
          .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
          .span-2 { grid-column: span 2; }
          
          .questions-list { display: flex; flex-direction: column; gap: 2rem; }
          .question-editor { padding: 2rem; background: var(--surface); display: flex; flex-direction: column; gap: 1.5rem; }
          .q-edit-header { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); opacity: 0.8; }
          .q-text-area { min-height: 80px; resize: vertical; margin-bottom: 1rem; }
          
          .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .option-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); transition: var(--transition-fast); }
          .option-row.correct { border-color: var(--success); background: rgba(16, 185, 129, 0.05); }
          
          .correct-toggle { background: none; color: var(--text-muted); transition: var(--transition-fast); }
          .option-row.correct .correct-toggle { color: var(--success); }
          .neo-input-compact { background: none; border: none; outline: none; color: var(--text-primary); font-size: 0.875rem; width: 100%; }
          
          .add-q-btn { width: 100%; padding: 1.25rem; border: 1px dashed var(--border); background: var(--surface-low); color: var(--text-secondary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; gap: 1rem; font-weight: 700; font-size: 0.875rem; transition: var(--transition-fast); }
          .add-q-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--surface); }
          
          .bulk-import-lite { display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.8125rem; }
          
          .finalize-step { display: flex; flex-direction: column; align-items: center; gap: 2rem; text-align: center; }
          .review-summary { width: 100%; max-width: 450px; padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; background: var(--surface); }
          .r-item { display: flex; justify-content: space-between; font-size: 0.9375rem; }
          .r-item span { color: var(--text-muted); }
          
          .wizard-footer { margin-top: auto; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; }
          .danger { color: var(--error); }
          .text-center { text-align: center; }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default CreateExam;
