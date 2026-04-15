import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Briefcase, 
    Users, 
    Eye, 
    Sparkles,
    User,
    BarChart3
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

interface Application {
    id: number;
    student_name: string;
    email: string;
    status: string;
    ai_match_score: number;
    applied_at: string;
}

interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    job_type: string;
    status: string;
    created_at: string;
}

const ManageJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [showPostModal, setShowPostModal] = useState(false);

    const [newJob, setNewJob] = useState({
        title: '',
        company: 'Institutional Placement Cell',
        location: 'On-site',
        job_type: 'Full-time',
        description: '',
        requirements: '',
        salary_range: 'Competitive'
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = getToken('teacher');
            const res = await axios.get('/api/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setJobs(res.data);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    const fetchApplications = async (jobId: number) => {
        try {
            const token = getToken('teacher');
            const res = await axios.get(`/api/jobs/${jobId}/applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setApplications(res.data);
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = getToken('teacher');
            await axios.post('/api/jobs/create', newJob, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShowPostModal(false);
            fetchJobs();
            setNewJob({
                title: '',
                company: 'Institutional Placement Cell',
                location: 'On-site',
                job_type: 'Full-time',
                description: '',
                requirements: '',
                salary_range: 'Competitive'
            });
        } catch (err) {
            alert('Failed to post job');
        }
    };

    return (
        <DashboardLayout userType="teacher">
            <div className="manage-jobs-container">
                <header className="page-header">
                    <div>
                        <h1>Job Placement Management</h1>
                        <p className="text-secondary">Post career openings and track student applications with AI insights.</p>
                    </div>
                    <button className="neo-btn-primary" onClick={() => setShowPostModal(true)}>
                        <Plus size={20} /> Post New Opportunity
                    </button>
                </header>

                <div className="jobs-stats-grid">
                    <div className="stat-card neo-card">
                        <div className="stat-icon purple"><Briefcase size={24} /></div>
                        <div className="stat-info">
                            <h3>{jobs.length}</h3>
                            <p>Active Postings</p>
                        </div>
                    </div>
                    <div className="stat-card neo-card">
                        <div className="stat-icon green"><Users size={24} /></div>
                        <div className="stat-info">
                            <h3>42</h3>
                            <p>Pending Applications</p>
                        </div>
                    </div>
                </div>

                <div className="management-main-grid">
                    <div className="postings-list-pane neo-card">
                        <div className="pane-header">
                            <h3>Active Postings</h3>
                        </div>
                        <div className="postings-list">
                            {jobs.map(job => (
                                <div 
                                    key={job.id} 
                                    className={`posting-item ${selectedJob?.id === job.id ? 'selected' : ''}`}
                                    onClick={() => { setSelectedJob(job); fetchApplications(job.id); }}
                                >
                                    <div className="posting-info">
                                        <h4>{job.title}</h4>
                                        <div className="posting-meta">
                                            <span>{job.job_type}</span>
                                            <span>•</span>
                                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="status-indicator">
                                        <div className={`dot ${job.status.toLowerCase()}`}></div>
                                        {job.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="applications-pane neo-card">
                        {selectedJob ? (
                            <>
                                <div className="pane-header">
                                    <h3>Applicants for <strong>{selectedJob.title}</strong></h3>
                                    <div className="header-actions">
                                        <span>{applications.length} Students</span>
                                    </div>
                                </div>
                                <div className="applicants-table-container">
                                    <table className="applicants-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Email</th>
                                                <th>Match Score</th>
                                                <th>Applied On</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map(app => (
                                                <tr key={app.id}>
                                                    <td>
                                                        <div className="student-profile">
                                                            <div className="avatar"><User size={16} /></div>
                                                            <span>{app.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{app.email}</td>
                                                    <td>
                                                        <div className="match-score-badge" style={{ 
                                                            background: app.ai_match_score > 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                            color: app.ai_match_score > 70 ? '#10b981' : '#f59e0b'
                                                        }}>
                                                            <Sparkles size={14} />
                                                            {app.ai_match_score}%
                                                        </div>
                                                    </td>
                                                    <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                                                    <td><span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span></td>
                                                    <td>
                                                        <button className="view-btn"><Eye size={18} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {applications.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                                        No applications received yet for this position.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="no-selection">
                                <BarChart3 size={48} />
                                <p>Select a job posting to view its applications and AI ranking.</p>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showPostModal && (
                        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
                            <motion.div 
                                className="modal-card neo-card" 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <h2>Post New Career Opening</h2>
                                    <p>Fill out the details below to broadcast this role to all eligible students.</p>
                                </div>
                                <form onSubmit={handleCreateJob} className="modal-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Job Title</label>
                                            <input 
                                                type="text" 
                                                className="neo-input" 
                                                required 
                                                placeholder="e.g. Senior Frontend Developer"
                                                value={newJob.title}
                                                onChange={e => setNewJob({...newJob, title: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Company / Department</label>
                                            <input 
                                                type="text" 
                                                className="neo-input" 
                                                value={newJob.company}
                                                onChange={e => setNewJob({...newJob, company: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Location</label>
                                            <input 
                                                type="text" 
                                                className="neo-input" 
                                                value={newJob.location}
                                                onChange={e => setNewJob({...newJob, location: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Employment Type</label>
                                            <select 
                                                className="neo-input"
                                                value={newJob.job_type}
                                                onChange={e => setNewJob({...newJob, job_type: e.target.value})}
                                            >
                                                <option>Full-time</option>
                                                <option>Internship</option>
                                                <option>Contract</option>
                                                <option>Part-time</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Job Description</label>
                                        <textarea 
                                            className="neo-input" 
                                            rows={4} 
                                            required 
                                            value={newJob.description}
                                            onChange={e => setNewJob({...newJob, description: e.target.value})}
                                        ></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>Requirements (One per line)</label>
                                        <textarea 
                                            className="neo-input" 
                                            rows={3}
                                            value={newJob.requirements}
                                            onChange={e => setNewJob({...newJob, requirements: e.target.value})}
                                        ></textarea>
                                    </div>
                                    <div className="modal-actions">
                                        <button 
                                            type="button" 
                                            className="neo-btn-secondary" 
                                            onClick={() => setShowPostModal(false)}
                                        >Cancel</button>
                                        <button type="submit" className="neo-btn-primary">Broadcast Job</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style>{`
                    .manage-jobs-container { display: flex; flex-direction: column; gap: 2rem; max-width: 1400px; margin: 0 auto; }
                    .page-header { display: flex; justify-content: space-between; align-items: center; }
                    .page-header h1 { font-size: 2rem; font-family: var(--font-display); }
                    
                    .jobs-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                    .stat-card { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; }
                    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                    .stat-icon.purple { background: rgba(99, 102, 241, 0.1); color: var(--accent); }
                    .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                    .stat-info h3 { font-size: 1.5rem; margin: 0; }
                    .stat-info p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; }

                    .management-main-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
                    .postings-list-pane { display: flex; flex-direction: column; }
                    .pane-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
                    .pane-header h3 { font-size: 1.1rem; margin: 0; }
                    
                    .postings-list { flex: 1; overflow-y: auto; padding: 1rem; }
                    .posting-item { padding: 1.25rem; border-radius: 12px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
                    .posting-item:hover { background: var(--surface-high); }
                    .posting-item.selected { background: rgba(99, 102, 241, 0.08); border-color: var(--accent); }
                    .posting-info h4 { margin: 0 0 0.5rem; font-size: 1rem; }
                    .posting-meta { display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
                    .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; }
                    .status-indicator .dot { width: 8px; height: 8px; border-radius: 50%; }
                    .status-indicator .dot.open { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }

                    .applications-pane { min-height: 600px; display: flex; flex-direction: column; }
                    .applicants-table-container { flex: 1; overflow-x: auto; }
                    .applicants-table { width: 100%; border-collapse: collapse; }
                    .applicants-table th { text-align: left; padding: 1rem 1.5rem; background: var(--surface-low); color: var(--text-muted); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                    .applicants-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
                    
                    .student-profile { display: flex; align-items: center; gap: 1rem; }
                    .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-high); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
                    .match-score-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.75rem; border-radius: 99px; font-weight: 700; font-size: 0.85rem; }
                    .status-pill { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
                    .status-pill.applied { background: rgba(99, 102, 241, 0.1); color: var(--accent); }
                    .view-btn { padding: 0.5rem; background: none; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease; }
                    .view-btn:hover { color: var(--accent); border-color: var(--accent); }

                    .no-selection { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: var(--text-muted); opacity: 0.6; }
                    
                    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                    .modal-card { width: 100%; max-width: 650px; padding: 2.5rem; }
                    .modal-form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                    @media (max-width: 1000px) {
                        .management-main-grid { grid-template-columns: 1fr; }
                        .jobs-stats-grid { grid-template-columns: repeat(2, 1fr); }
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageJobs;
