import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Plus, Trash2, Upload, FileText, ImageIcon } from 'lucide-react';
import { getToken } from '../utils/auth';

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddQuestions: (questions: any[]) => void;
}

// Available reference categories (mapped to sections in the CSV dataset)
const REFERENCE_CATEGORIES = [
    { value: '', label: '--- None (AI generates freely) ---' },
    { value: 'AI & ML', label: '🤖 AI & Machine Learning' },
    { value: 'DevOps Engineer', label: '⚙️ DevOps Engineer' },
    { value: 'React Engineer', label: '⚛️ React Engineer' },
    { value: 'SAP Engineer', label: '🏢 SAP Engineer' },
    { value: 'Computer Science', label: '💻 Computer Science' },
    { value: 'Numerical Ability', label: '🔢 Numerical Ability' },
    { value: 'Logical Reasoning', label: '🧩 Logical Reasoning' },
    { value: 'Verbal Ability', label: '📝 Verbal Ability' },
    { value: 'Quantitative Aptitude', label: '📊 Quantitative Aptitude' },
];

const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose, onAddQuestions }) => {
    const [context, setContext] = useState('');
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');
    const [category, setCategory] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [referenceUsed, setReferenceUsed] = useState<boolean | null>(null);
    const [matchedSection, setMatchedSection] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!context.trim() && !selectedFile && !category.trim()) {
            setError('Please provide some context, upload a file, or select a reference category.');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const formData = new FormData();
            formData.append('context', context);
            formData.append('count', count.toString());
            formData.append('difficulty', difficulty);
            formData.append('category', category);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch('/api/ai/generate-questions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken('teacher')}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.questions) {
                // Ensure options are formatted correctly as strings for the frontend
                const formatted = data.questions.map((q: any) => ({
                    question: q.question,
                    options: q.options.map((opt: string) => opt),
                    correct_answer: q.correct_answer,
                    marks: difficulty === 'Hard' ? 4 : difficulty === 'Medium' ? 2 : 1
                }));
                setGeneratedQuestions(formatted);
                setReferenceUsed(data.meta?.referenceUsed ?? false);
                setMatchedSection(data.meta?.matchedSection ?? null);
            } else {
                setError(data.message || 'Failed to generate questions. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while connecting to the AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemoveQuestion = (index: number) => {
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddAll = () => {
        if (generatedQuestions.length > 0) {
            onAddQuestions(generatedQuestions);
            onClose();
            // Reset state
            setTimeout(() => {
                setContext('');
                setSelectedFile(null);
                setGeneratedQuestions([]);
                setReferenceUsed(null);
                setMatchedSection(null);
            }, 300);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError('Invalid file type. Please upload a PDF or Image (JPG/PNG).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File too large. Max size is 5MB.');
                return;
            }
            setSelectedFile(file);
            setError('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="modal-content ai-modal"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="header-title">
                            <Sparkles className="ai-icon" size={24} />
                            <h2>Generate Questions with AI</h2>
                        </div>
                        <button onClick={onClose} className="close-btn"><X size={20} /></button>
                    </div>

                    <div className="modal-body">
                        {error && <div className="error-alert">{error}</div>}

                        {generatedQuestions.length === 0 ? (
                            <div className="generator-setup">
                                <div className="form-group">
                                    <label>Paste Syllabus, Notes, or Dataset Context</label>
                                    <textarea
                                        className="neo-input"
                                        placeholder="Paste the educational material here, or upload a file below. The AI will read both and generate MCQs..."
                                        value={context}
                                        onChange={(e) => setContext(e.target.value)}
                                        rows={6}
                                        disabled={isGenerating}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Upload Syllabus (PDF or Image)</label>
                                    <div 
                                        className={`upload-zone ${selectedFile ? 'has-file' : ''}`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            accept=".pdf,image/*" 
                                            style={{ display: 'none' }}
                                        />
                                        {selectedFile ? (
                                            <div className="file-preview">
                                                {selectedFile.type === 'application/pdf' ? <FileText size={24} /> : <ImageIcon size={24} />}
                                                <div className="file-info">
                                                    <span className="file-name">{selectedFile.name}</span>
                                                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                                <button 
                                                    className="remove-file" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFile(null);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="upload-placeholder">
                                                <Upload size={32} className="upload-icon" />
                                                <p>Drop PDF/Image or click to browse</p>
                                                <span>Max size: 5MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reference Category <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional — guides AI style)</span></label>
                                    <select
                                        className="neo-input"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        disabled={isGenerating}
                                    >
                                        {REFERENCE_CATEGORIES.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                                        💡 You can also type any topic in the context box. If a category isn't in the list, AI will generate freely.
                                    </span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Number of Questions</label>
                                        <input
                                            type="number"
                                            className="neo-input"
                                            value={count}
                                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                            min={1}
                                            max={20}
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Difficulty Level</label>
                                        <select
                                            className="neo-input"
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            disabled={isGenerating}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    className="neo-btn-primary full-width generate-btn"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || (!context.trim() && !selectedFile && !category.trim())}
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="animate-spin" size={20} /> Generating with Groq AI...</>
                                    ) : (
                                        <><Sparkles size={20} /> Generate Questions</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="review-section">
                                <div className="review-header">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <h3 style={{ margin: 0 }}>Review Generated Questions ({generatedQuestions.length})</h3>
                                        {referenceUsed !== null && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                display: 'inline-block',
                                                width: 'fit-content',
                                                background: referenceUsed
                                                    ? 'rgba(16, 185, 129, 0.12)'
                                                    : 'rgba(99, 102, 241, 0.12)',
                                                color: referenceUsed ? '#10b981' : '#818cf8',
                                                border: `1px solid ${referenceUsed ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`
                                            }}>
                                                {referenceUsed
                                                    ? `✅ Generated using "${matchedSection}" CSV reference`
                                                    : '🤖 AI generated freely (no CSV match)'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className="retry-btn"
                                        onClick={() => { setGeneratedQuestions([]); setReferenceUsed(null); setMatchedSection(null); }}
                                    >
                                        Start Over
                                    </button>
                                </div>

                                <div className="generated-questions-list">
                                    {generatedQuestions.map((q, index) => (
                                        <div key={index} className="generated-q-card">
                                            <div className="q-card-header">
                                                <span className="q-num">Q{index + 1}</span>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleRemoveQuestion(index)}
                                                    title="Remove Question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="q-text">{q.question}</p>
                                            <div className="q-options">
                                                {q.options.map((opt: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className={`q-opt ${q.correct_answer === opt ? 'correct-opt' : ''}`}
                                                    >
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="modal-actions">
                                    <button className="neo-btn-secondary" onClick={onClose}>Cancel</button>
                                    <button
                                        className="neo-btn-primary add-all-btn"
                                        onClick={handleAddAll}
                                    >
                                        <Plus size={20} /> Add to Exam
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <style>{`
                    .ai-modal { max-width: 700px; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
                    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--surface-low); }
                    .header-title { display: flex; align-items: center; gap: 0.75rem; }
                    .header-title h2 { margin: 0; font-size: 1.25rem; }
                    .ai-icon { color: var(--accent); }
                    .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
                    
                    .generator-setup { display: flex; flex-direction: column; gap: 1.5rem; }
                    .form-group label { margin-bottom: 0.5rem; display: block; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary); }
                    .form-group textarea { resize: vertical; min-height: 100px; font-family: inherit; line-height: 1.5; }
                    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

                    .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius-sm); padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s ease; background: var(--surface-low); }
                    .upload-zone:hover { border-color: var(--accent); background: rgba(99, 102, 241, 0.05); }
                    .upload-zone.has-file { border-style: solid; border-color: var(--accent); background: rgba(99, 102, 241, 0.05); }
                    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-muted); }
                    .upload-placeholder p { margin: 0; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); }
                    .upload-placeholder span { font-size: 0.75rem; }
                    .upload-icon { color: var(--text-muted); margin-bottom: 0.25rem; }
                    
                    .file-preview { display: flex; align-items: center; gap: 1rem; text-align: left; }
                    .file-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                    .file-name { font-weight: 500; font-size: 0.875rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .file-size { font-size: 0.75rem; color: var(--text-muted); }
                    .remove-file { background: none; border: none; color: #ef4444; padding: 0.5rem; border-radius: 50%; cursor: pointer; transition: all 0.2s ease; }
                    .remove-file:hover { background: rgba(239, 68, 68, 0.1); }
                    
                    .generate-btn { margin-top: 1rem; padding: 1rem; font-size: 1rem; background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%); border: none; }
                    .generate-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
                    
                    .error-alert { padding: 1rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); margin-bottom: 1.5rem; font-size: 0.875rem; }
                    
                    .review-section { display: flex; flex-direction: column; gap: 1.5rem; height: 100%; }
                    .review-header { display: flex; justify-content: space-between; align-items: center; }
                    .review-header h3 { margin: 0; font-size: 1.125rem; }
                    .retry-btn { background: none; border: none; color: var(--text-muted); font-size: 0.875rem; cursor: pointer; text-decoration: underline; }
                    .retry-btn:hover { color: var(--text-primary); }
                    
                    .generated-questions-list { display: flex; flex-direction: column; gap: 1rem; }
                    .generated-q-card { background: var(--surface-high); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.25rem; }
                    .q-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                    .q-num { font-size: 0.75rem; font-weight: 700; background: var(--surface-low); padding: 0.25rem 0.5rem; border-radius: 4px; color: var(--text-secondary); }
                    .q-text { font-weight: 500; margin: 0 0 1rem 0; line-height: 1.5; }
                    .q-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                    .q-opt { padding: 0.5rem 0.75rem; background: var(--surface-low); border: 1px solid var(--border); border-radius: 6px; font-size: 0.875rem; color: var(--text-secondary); }
                    .q-opt.correct-opt { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; font-weight: 600; }
                    
                    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
                    .add-all-btn { background: #10b981; color: #fff; border: none; }
                    .add-all-btn:hover { background: #059669; }
                `}</style>
            </div>
        </AnimatePresence>
    );
};

export default AIGeneratorModal;
