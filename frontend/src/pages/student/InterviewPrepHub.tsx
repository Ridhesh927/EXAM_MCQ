import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, ImageIcon, Loader2, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './InterviewPrepHub.css';
import { useNavigate } from 'react-router-dom';

interface Interview {
    id: number;
    job_role_target: string;
    total_score: number;
    ai_feedback: string | null;
    created_at: string;
}

const InterviewPrepHub = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [hasResume, setHasResume] = useState(false);
    const [parsedSkills, setParsedSkills] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generation State
    const [targetRole, setTargetRole] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/interview/history');
            setInterviews(data.interviews || []);
            setHasResume(data.hasResume);
            setParsedSkills(data.parsedSkills || []);
        } catch (error) {
            console.error("Failed to load interview history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            
            if (!validTypes.includes(file.type)) {
                setUploadError('Invalid file type. Please upload a PDF or Image (JPG/PNG).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setUploadError('File too large. Max size is 5MB.');
                return;
            }
            
            setUploadError('');
            setSelectedFile(file);
            await uploadResume(file);
        }
    };

    const uploadResume = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('student_token');
            const response = await fetch('/api/interview/upload-resume', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Upload failed');

            setHasResume(true);
            setParsedSkills(data.skills || []);
            setSelectedFile(null);
            
            // Optional: User-friendly toast here
        } catch (error: any) {
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (!targetRole.trim() || !hasResume) return;
        
        setIsGenerating(true);
        try {
            const data = await apiFetch('/api/interview/generate', {
                method: 'POST',
                body: JSON.stringify({ jobRoleTarget: targetRole })
            });
            
            // Navigate directly to the new interview, or refresh list
            if (data.interviewId) {
                 navigate(`/student/interview/${data.interviewId}`);
            } else {
                fetchDashboardData();
            }
        } catch (error: any) {
            alert(error.message || 'Failed to generate interview.');
        } finally {
            setIsGenerating(false);
            setTargetRole('');
        }
    };

    if (isLoading) {
        return <div className="loading-state"><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <motion.div 
            className="interview-hub-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="hub-header">
                <h1>AI Interview Preparation</h1>
                <p>Upload your CV and practice personalized technical interviews tailored to your target role.</p>
            </div>

            <div className="hub-grid">
                {/* Let Sidebar: Resume & config */}
                <div className="hub-sidebar">
                    <div className="card profile-card">
                        <h3>Your Resume Profile</h3>
                        
                        {hasResume ? (
                            <div className="resume-active">
                                <div className="status-badge success">
                                    <CheckCircle size={16} /> Resume Processed
                                </div>
                                
                                {parsedSkills.length > 0 && (
                                    <div className="skills-container">
                                        <h4>Detected Skills:</h4>
                                        <div className="skills-tags">
                                            {parsedSkills.map((skill, i) => (
                                                <span key={i} className="skill-tag">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <button 
                                    className="neo-btn-secondary text-sm mt-4"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : 'Update Resume'}
                                </button>
                            </div>
                        ) : (
                            <div className="resume-upload">
                                <p>Upload your latest CV to let the AI analyze your background.</p>
                                <div 
                                    className="upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin" size={32} />
                                    ) : (
                                        <>
                                            <Upload size={32} />
                                            <span>Click to upload PDF/Image</span>
                                        </>
                                    )}
                                </div>
                                {uploadError && <p className="error-text">{uploadError}</p>}
                            </div>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".pdf,image/*" 
                            style={{ display: 'none' }}
                        />
                    </div>

                    {hasResume && (
                        <div className="card generate-card">
                            <h3>Start New Mock Interview</h3>
                            <div className="form-group">
                                <label>Target Job Role</label>
                                <input 
                                    type="text" 
                                    className="neo-input"
                                    placeholder="e.g. Full Stack Developer, Data Analyst"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    disabled={isGenerating}
                                />
                            </div>
                            <button 
                                className="neo-btn-primary full-width mt-4"
                                onClick={handleGenerate}
                                disabled={isGenerating || !targetRole.trim()}
                            >
                                {isGenerating ? (
                                    <><Loader2 className="animate-spin" size={18} /> Building Interview...</>
                                ) : (
                                    <><Sparkles size={18} /> Generate 15-Min Interview</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Area: History */}
                <div className="hub-main card">
                    <h3>Your Interview History</h3>
                    
                    {interviews.length === 0 ? (
                        <div className="empty-history">
                            <Clock size={48} />
                            <p>You haven't taken any mock interviews yet.</p>
                            {hasResume ? <span>Generate one using the panel on the left!</span> : <span>Upload your resume to get started.</span>}
                        </div>
                    ) : (
                        <div className="interviews-list">
                            {interviews.map(interview => (
                                <div key={interview.id} className="interview-item">
                                    <div className="interview-header">
                                        <h4>{interview.job_role_target}</h4>
                                        <span className="date">{new Date(interview.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="interview-stats">
                                        <div className="stat">
                                            <span className="label">Score</span>
                                            <span className={`value ${interview.total_score >= 70 ? 'good' : 'warning'}`}>
                                                {interview.total_score}%
                                            </span>
                                        </div>
                                        <div className="status">
                                            {interview.ai_feedback ? 'Completed & Evaluated' : 'Pending/Saved'}
                                        </div>
                                    </div>
                                    {interview.ai_feedback && (
                                        <div className="feedback-snippet">
                                            {interview.ai_feedback.substring(0, 150)}...
                                        </div>
                                    )}
                                    <div className="actions">
                                        {interview.ai_feedback ? (
                                             <button className="neo-btn-secondary text-sm" onClick={() => navigate(`/student/interview/result/${interview.id}`)}>View Full Report</button>
                                        ) : (
                                             <button className="neo-btn-primary text-sm" onClick={() => navigate(`/student/interview/${interview.id}`)}>Continue Interview</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default InterviewPrepHub;
