import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Briefcase, 
    MapPin, 
    Clock, 
    DollarSign, 
    ChevronRight, 
    Search, 
    Filter,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    job_type: string;
    description: string;
    requirements: string;
    salary_range: string;
    created_at: string;
}

const JobBoard = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
    const [applySuccess, setApplySuccess] = useState<number | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = getToken('student');
            const res = await axios.get('/api/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setJobs(res.data);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: number) => {
        setIsApplying(true);
        try {
            const token = getToken('student');
            const res = await axios.post(`/api/jobs/apply/${jobId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setApplySuccess(res.data.matchScore);
            setAppliedJobs(prev => [...prev, jobId]);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to apply');
        } finally {
            setIsApplying(false);
        }
    };

    const filteredJobs = jobs.filter(j => 
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout userType="student">
            <div className="job-board-container">
                <header className="page-header">
                    <div>
                        <h1>Career Opportunities</h1>
                        <p className="text-secondary">Explore roles tailored to your skills and performance.</p>
                    </div>
                    <div className="job-stats">
                        <div className="stat-card">
                            <Briefcase size={20} className="text-accent" />
                            <span><strong>{jobs.length}</strong> Positions</span>
                        </div>
                    </div>
                </header>

                <div className="search-bar-container neo-card">
                    <div className="search-input-wrapper">
                        <Search size={20} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search by role, company or keyword..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="filter-btn">
                        <Filter size={18} /> Filters
                    </button>
                </div>

                <div className="job-main-content">
                    <div className="job-list-pane">
                        {loading ? (
                            <div className="loading-state">Loading placements...</div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="empty-state">No jobs found matching your criteria.</div>
                        ) : (
                            filteredJobs.map(job => (
                                <motion.div 
                                    key={job.id}
                                    layoutId={`job-${job.id}`}
                                    className={`job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedJob(job); setApplySuccess(null); }}
                                >
                                    <div className="job-card-header">
                                        <h3>{job.title}</h3>
                                        <span className="job-tag">{job.job_type}</span>
                                    </div>
                                    <div className="job-card-meta">
                                        <span>{job.company}</span>
                                        <span className="dot">•</span>
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="job-card-footer">
                                        <span className="salary">{job.salary_range}</span>
                                        <ChevronRight size={18} />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="job-details-pane">
                        <AnimatePresence mode="wait">
                            {selectedJob ? (
                                <motion.div 
                                    key={selectedJob.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="details-content neo-card"
                                >
                                    <div className="details-header">
                                        <div className="details-title-box">
                                            <h2>{selectedJob.title}</h2>
                                            <p>{selectedJob.company}</p>
                                        </div>
                                        <div className="details-badges">
                                            <div className="badge"><MapPin size={14} /> {selectedJob.location}</div>
                                            <div className="badge"><Clock size={14} /> {selectedJob.job_type}</div>
                                            <div className="badge"><DollarSign size={14} /> {selectedJob.salary_range}</div>
                                        </div>
                                    </div>

                                    <div className="details-body">
                                        <section>
                                            <h4>Role Description</h4>
                                            <p>{selectedJob.description}</p>
                                        </section>
                                        <section>
                                            <h4>Requirements</h4>
                                            <div className="req-text">{selectedJob.requirements}</div>
                                        </section>
                                    </div>

                                    <footer className="details-footer">
                                        {appliedJobs.includes(selectedJob.id) ? (
                                            <div className="applied-banner">
                                                <div className="applied-msg">
                                                    <CheckCircle2 size={24} className="text-success" />
                                                    <div>
                                                        <strong>Application Submitted!</strong>
                                                        <p>Our team will review your profile shortly.</p>
                                                    </div>
                                                </div>
                                                {applySuccess !== null && (
                                                    <div className="ai-match-box">
                                                        <Sparkles size={16} />
                                                        <span>AI Match: <strong>{applySuccess}%</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button 
                                                className="apply-btn-primary"
                                                onClick={() => handleApply(selectedJob.id)}
                                                disabled={isApplying}
                                            >
                                                {isApplying ? 'Processing Application...' : 'Apply Now'}
                                            </button>
                                        )}
                                    </footer>
                                </motion.div>
                            ) : (
                                <div className="details-placeholder neo-card">
                                    <Briefcase size={48} />
                                    <h3>Select a job to view details</h3>
                                    <p>Browse through available positions and apply directly through the portal.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <style>{`
                    .job-board-container { display: flex; flex-direction: column; gap: 2rem; max-width: 1400px; margin: 0 auto; padding-bottom: 3rem; }
                    .page-header { display: flex; justify-content: space-between; align-items: center; }
                    .page-header h1 { font-size: 2rem; font-family: var(--font-display); }
                    .job-stats { display: flex; gap: 1rem; }
                    .stat-card { background: var(--surface); padding: 0.75rem 1.25rem; border-radius: 99px; border: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
                    
                    .search-bar-container { display: flex; gap: 1rem; padding: 1.25rem; align-items: center; }
                    .search-input-wrapper { flex: 1; position: relative; display: flex; align-items: center; }
                    .search-icon { position: absolute; left: 1.25rem; color: var(--text-muted); }
                    .search-input-wrapper input { width: 100%; height: 50px; padding: 0 1rem 0 3.5rem; background: var(--surface-low); border: 1px solid var(--border); border-radius: 12px; color: var(--text-primary); outline: none; transition: all 0.3s ease; font-size: 0.95rem; }
                    .search-input-wrapper input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
                    .filter-btn { height: 50px; padding: 0 1.5rem; background: var(--surface-high); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; color: var(--text-primary); cursor: pointer; transition: all 0.2s ease; }
                    .filter-btn:hover { border-color: var(--accent); background: var(--surface); }

                    .job-main-content { display: grid; grid-template-columns: 420px 1fr; gap: 2rem; height: calc(100vh - 320px); min-height: 600px; }
                    
                    .job-list-pane { overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding-right: 0.5rem; }
                    .job-card { background: var(--surface-low); border: 1px solid var(--border); padding: 1.5rem; border-radius: 16px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                    .job-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.2); background: var(--surface); }
                    .job-card.active { border-color: var(--accent); background: rgba(99, 102, 241, 0.08); border-width: 2px; }
                    
                    .job-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
                    .job-card-header h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
                    .job-tag { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: rgba(99, 102, 241, 0.15); color: var(--accent); padding: 0.25rem 0.6rem; border-radius: 6px; }
                    .job-card-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; }
                    .dot { opacity: 0.5; }
                    .job-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; }
                    .salary { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }

                    .job-details-pane { height: 100%; position: sticky; top: 0; }
                    .details-content { height: 100%; display: flex; flex-direction: column; padding: 2.5rem; background: var(--surface-low); }
                    .details-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem; }
                    .details-title-box h2 { font-size: 1.85rem; margin-bottom: 0.5rem; }
                    .details-title-box p { font-size: 1.1rem; color: var(--accent); font-weight: 500; }
                    .details-badges { display: flex; gap: 1rem; margin-top: 1.5rem; }
                    .badge { background: var(--surface-high); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem; color: var(--text-secondary); }
                    
                    .details-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2.5rem; margin-bottom: 2rem; }
                    .details-body h4 { font-size: 1rem; margin-bottom: 1rem; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid var(--accent); padding-left: 1rem; }
                    .details-body p { line-height: 1.7; color: var(--text-secondary); font-size: 1rem; }
                    .req-text { white-space: pre-wrap; line-height: 1.7; color: var(--text-secondary); font-size: 1rem; }

                    .details-footer { border-top: 1px solid var(--border); padding-top: 2rem; }
                    .apply-btn-primary { width: 100%; height: 60px; background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%); border: none; border-radius: 14px; color: white; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3); }
                    .apply-btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4); }
                    .apply-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                    .applied-banner { display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.25rem; border-radius: 14px; }
                    .applied-msg { display: flex; gap: 1.25rem; align-items: center; }
                    .applied-msg strong { font-size: 1.1rem; color: #10b981; display: block; }
                    .applied-msg p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); }
                    .ai-match-box { background: var(--surface-high); padding: 0.75rem 1.25rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; border: 1px solid var(--border); }
                    .ai-match-box span { font-size: 0.85rem; }
                    .ai-match-box strong { color: var(--accent); font-size: 1.1rem; }

                    .details-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1.5rem; color: var(--text-muted); opacity: 0.6; }
                    .details-placeholder h3 { margin: 0; }

                    @media (max-width: 1100px) {
                        .job-main-content { grid-template-columns: 1fr; }
                        .job-details-pane { display: none; }
                    }
                `}</style>
            </div>
        </DashboardLayout>
    );
};

export default JobBoard;
