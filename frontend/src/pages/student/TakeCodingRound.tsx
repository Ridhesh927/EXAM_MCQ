import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Loader2, Send, AlertTriangle, CheckCircle, Code2, Play, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './TakeCodingRound.css';

interface CodingQuestion {
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string;
    hint?: string;
}

interface CodingRound {
    id: number;
    include_hard: boolean;
    questions: CodingQuestion[];
    language: string;
}

const LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
];

const STARTER_CODE: Record<string, string> = {
    javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
    python: '# Write your solution here\ndef solution():\n    pass\n',
    java: '// Write your solution here\nclass Solution {\n    public void solution() {\n        \n    }\n}\n',
    cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    \n}\n',
};

const DIFF_COLOR: Record<string, string> = {
    Easy: '#22c55e',
    Medium: '#eab308',
    Hard: '#ef4444',
};



const TakeCodingRound = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [round, setRound] = useState<CodingRound | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeQ, setActiveQ] = useState(0);
    const [language, setLanguage] = useState('javascript');
    
    // Store code per language
    const [codesByLang, setCodesByLang] = useState<Record<string, { q1: string, q2: string }>>({
        javascript: { q1: STARTER_CODE['javascript'], q2: STARTER_CODE['javascript'] },
        python: { q1: STARTER_CODE['python'], q2: STARTER_CODE['python'] },
        java: { q1: STARTER_CODE['java'], q2: STARTER_CODE['java'] },
        cpp: { q1: STARTER_CODE['cpp'], q2: STARTER_CODE['cpp'] },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [runOutput, setRunOutput] = useState<{ stdout: string; stderr: string; compile: string; ai_test_feedback?: string } | null>(null);
    const [showConsole, setShowConsole] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await apiFetch(`/api/coding/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setRound(data.round);
            } catch (e: any) {
                alert(e.message);
                navigate('/student/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id, navigate]);

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
    };

    const handleRunCode = async () => {
        setRunState('running');
        setShowConsole(true);
        setRunOutput(null);

        const currentCode = codesByLang[language][activeQ === 0 ? 'q1' : 'q2'];
        try {
            const res = await apiFetch('/api/coding/execute', {
                method: 'POST',
                body: JSON.stringify({
                    language,
                    sourceCode: currentCode,
                    stdin: '',
                    codingId: id,
                    questionIndex: activeQ
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                setRunOutput({
                    stdout: data.stdout || '',
                    stderr: data.stderr || '',
                    compile: data.compile_output || '',
                    ai_test_feedback: data.ai_test_feedback || ''
                });
                
                // Set explicitly failed if AI says Failed
                if (data.ai_test_feedback && data.ai_test_feedback.includes('❌ Failed')) {
                    setRunState('error');
                } else {
                    setRunState(data.status?.id === 3 ? 'success' : 'error');
                }
            } else {
                throw new Error(data.message || 'Execution failed');
            }
        } catch (e: any) {
            setRunOutput({ stdout: '', stderr: e.message || 'Failed to reach execution engine.', compile: '' });
            setRunState('error');
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/coding/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ q1Code: codesByLang[language].q1, q2Code: codesByLang[language].q2, language }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            navigate(`/student/coding/result/${id}`);
        } catch (e: any) {
            alert(e.message || 'Submission failed.');
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="coding-full-loader">
            <Loader2 className="animate-spin" size={48} />
            <p>Loading your coding challenge...</p>
        </div>
    );

    if (!round) return null;

    const q = round.questions[activeQ];
    const codeKey = activeQ === 0 ? 'q1' : 'q2';

    return (
        <div className="coding-container">
            {/* Top bar */}
            <header className="coding-header">
                <div className="coding-header-left">
                    <Code2 size={22} className="text-accent" />
                    <span className="coding-title">DSA Coding Round</span>
                    <div className="q-tabs">
                        {round.questions.map((q2, i) => (
                            <button
                                key={i}
                                className={`q-tab ${activeQ === i ? 'active' : ''}`}
                                onClick={() => { setActiveQ(i); setShowHint(false); }}
                            >
                                Q{i + 1}
                                <span className="diff-tag" style={{ background: DIFF_COLOR[q2.difficulty] + '22', color: DIFF_COLOR[q2.difficulty] }}>
                                    {q2.difficulty}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="coding-header-right">
                    <select
                        className="lang-select"
                        value={language}
                        onChange={e => handleLanguageChange(e.target.value)}
                    >
                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={handleRunCode}
                            disabled={runState === 'running' || isSubmitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--surface-high)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', opacity: (runState === 'running' || isSubmitting) ? 0.6 : 1 }}
                        >
                            {runState === 'running' ? (
                                <><Loader2 size={16} className="animate-spin" /> Running...</>
                            ) : (
                                <><Play size={16} /> Run Code</>
                            )}
                        </button>
                        <button
                            className="submit-code-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting || runState === 'running'}
                        >
                            {isSubmitting ? (
                                <><Loader2 size={16} className="animate-spin" /> AI Grading...</>
                            ) : (
                                <><Send size={16} /> Submit Both Solutions</>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main split pane */}
            <div className="coding-split">
                {/* Left: Problem Statement */}
                <div className="problem-pane">
                    <div className="problem-title-row">
                        <h2>{q.title}</h2>
                        <span className="diff-badge" style={{ background: DIFF_COLOR[q.difficulty] + '22', color: DIFF_COLOR[q.difficulty] }}>
                            {q.difficulty}
                        </span>
                    </div>

                    <p className="problem-description">{q.description}</p>

                    {q.examples.map((ex, i) => (
                        <div key={i} className="example-block">
                            <div className="example-label">Example {i + 1}</div>
                            <div className="example-line"><strong>Input:</strong> <code>{ex.input}</code></div>
                            <div className="example-line"><strong>Output:</strong> <code>{ex.output}</code></div>
                            {ex.explanation && <div className="example-line text-muted"><strong>Explanation:</strong> {ex.explanation}</div>}
                        </div>
                    ))}

                    <div className="constraints-block">
                        <strong>Constraints:</strong>
                        <pre>{q.constraints}</pre>
                    </div>

                    {q.hint && (
                        <div className="hint-section">
                            <button className="hint-toggle" onClick={() => setShowHint(v => !v)}>
                                <AlertTriangle size={14} /> {showHint ? 'Hide Hint' : 'Show Hint'}
                            </button>
                            {showHint && <p className="hint-text">{q.hint}</p>}
                        </div>
                    )}
                </div>

                {/* Right: Monaco Editor + Console */}
                <div className="editor-pane" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="editor-tabs" style={{ flexShrink: 0 }}>
                        {round.questions.map((_, i) => (
                            <button
                                key={i}
                                className={`editor-tab ${activeQ === i ? 'active' : ''}`}
                                onClick={() => { setActiveQ(i); setShowConsole(false); }}
                            >
                                {i === 0 ? <CheckCircle size={14} style={{ color: codesByLang[language].q1 !== STARTER_CODE[language] ? '#22c55e' : 'currentColor' }} /> : <CheckCircle size={14} style={{ color: codesByLang[language].q2 !== STARTER_CODE[language] ? '#22c55e' : 'currentColor' }} />}
                                &nbsp;Q{i + 1}.{language.slice(0, 2)}
                            </button>
                        ))}
                    </div>
                    <div style={{ flexGrow: 1, minHeight: 0 }}>
                        <Editor
                            height={showConsole ? "calc(100vh - 430px)" : "calc(100vh - 180px)"}
                            language={language}
                            value={codesByLang[language][codeKey]}
                            onChange={val => setCodesByLang(prev => ({
                                ...prev,
                                [language]: {
                                    ...prev[language],
                                    [codeKey]: val || ''
                                }
                            }))}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                            }}
                        />
                    </div>
                    
                    {/* Execution Console */}
                    {showConsole && (
                        <div className="output-console neo-card" style={{ height: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)', margin: 0, borderRadius: 0, animation: 'slideUp 0.3s ease-out' }}>
                            <div className="console-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: 'var(--surface-high)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>Execution Console</span>
                                    {runState === 'success' && <span style={{ color: '#22c55e', fontSize: '0.75rem', background: '#22c55e22', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>Success</span>}
                                    {runState === 'error' && <span style={{ color: '#ef4444', fontSize: '0.75rem', background: '#ef444422', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>Error</span>}
                                </div>
                                <button onClick={() => setShowConsole(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="console-body" style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                {runState === 'running' && <div style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Loader2 size={14} className="animate-spin" /> Compiling and executing...</div>}
                                {runState !== 'running' && runOutput && (
                                    <>
                                        {runOutput.ai_test_feedback && (
                                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: runOutput.ai_test_feedback.includes('❌') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: `1px solid ${runOutput.ai_test_feedback.includes('❌') ? '#ef444455' : '#22c55e55'}`, borderRadius: '6px' }}>
                                                <strong style={{ marginBottom: '0.3rem', color: runOutput.ai_test_feedback.includes('❌') ? '#fca5a5' : '#86efac', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    AI Test Runner:
                                                </strong>
                                                <div style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{runOutput.ai_test_feedback}</div>
                                            </div>
                                        )}
                                        {runOutput.compile && (
                                            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                                                <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#fca5a5' }}>Compile Error:</strong>
                                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{runOutput.compile}</pre>
                                            </div>
                                        )}
                                        {runOutput.stderr && (
                                            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                                                <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#fca5a5' }}>Error / Exception:</strong>
                                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{runOutput.stderr}</pre>
                                            </div>
                                        )}
                                        {runOutput.stdout && (
                                            <div>
                                                <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#86efac' }}>Output:</strong>
                                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{runOutput.stdout}</pre>
                                            </div>
                                        )}
                                        {!runOutput.compile && !runOutput.stderr && !runOutput.stdout && (
                                            <div style={{ color: '#888', fontStyle: 'italic' }}>Program exited with code 0 (No output from stdout/stderr).</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TakeCodingRound;
