import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Loader2, Send, AlertTriangle, CheckCircle, Code2 } from 'lucide-react';
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
    const [codes, setCodes] = useState({ q1: STARTER_CODE['javascript'], q2: STARTER_CODE['javascript'] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHint, setShowHint] = useState(false);

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
        // Inject default code only if it's still default
        setCodes(prev => ({
            q1: prev.q1 === STARTER_CODE[language] ? STARTER_CODE[lang] : prev.q1,
            q2: prev.q2 === STARTER_CODE[language] ? STARTER_CODE[lang] : prev.q2,
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/coding/${id}/submit`, {
                method: 'POST',
                body: JSON.stringify({ q1Code: codes.q1, q2Code: codes.q2, language }),
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
                    <button
                        className="submit-code-btn"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin" /> AI Grading...</>
                        ) : (
                            <><Send size={16} /> Submit Both Solutions</>
                        )}
                    </button>
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

                {/* Right: Monaco Editor */}
                <div className="editor-pane">
                    <div className="editor-tabs">
                        {round.questions.map((_, i) => (
                            <button
                                key={i}
                                className={`editor-tab ${activeQ === i ? 'active' : ''}`}
                                onClick={() => setActiveQ(i)}
                            >
                                {i === 0 ? <CheckCircle size={14} style={{ color: codes.q1 !== STARTER_CODE[language] ? '#22c55e' : 'currentColor' }} /> : <CheckCircle size={14} style={{ color: codes.q2 !== STARTER_CODE[language] ? '#22c55e' : 'currentColor' }} />}
                                &nbsp;Q{i + 1}.{language.slice(0, 2)}
                            </button>
                        ))}
                    </div>
                    <Editor
                        height="calc(100vh - 130px)"
                        language={language}
                        value={codes[codeKey]}
                        onChange={val => setCodes(prev => ({ ...prev, [codeKey]: val || '' }))}
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
            </div>
        </div>
    );
};

export default TakeCodingRound;
