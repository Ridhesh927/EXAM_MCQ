import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    MoreVertical,
    Users,
    Calendar,
    Layers
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const ManageExams = () => {
    const navigate = useNavigate();
    const exams = [
        { id: '1', title: 'Advanced Thermodynamics', subject: 'Physics', students: 42, date: '2025-05-12', status: 'Active' },
        { id: '2', title: 'Digital Logic Design', subject: 'CS', students: 128, date: '2025-05-15', status: 'Draft' },
        { id: '3', title: 'Renaissance Art History', subject: 'History', students: 56, date: '2025-05-18', status: 'Scheduled' },
    ];

    return (
        <DashboardLayout userType="teacher">
            <div className="manage-exams-page">
                <header className="page-header">
                    <div>
                        <h1>Curriculum Inventory</h1>
                        <p className="text-secondary">Manage and deploy your academic assessments.</p>
                    </div>
                    <button className="neo-btn-primary" onClick={() => navigate('/teacher/create-exam')}>
                        <Plus size={20} /> Author New Exam
                    </button>
                </header>

                <div className="table-actions neo-card">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Search by title or subject..." />
                    </div>
                    <div className="filter-group">
                        <button className="text-btn">All</button>
                        <button className="text-btn active">Active</button>
                        <button className="text-btn">Drafts</button>
                    </div>
                </div>

                <div className="exams-inventory">
                    {exams.map((exam, i) => (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="inventory-item neo-card"
                        >
                            <div className="item-main">
                                <div className="item-icon">
                                    <Layers size={24} className="text-accent" />
                                </div>
                                <div className="item-details">
                                    <h3>{exam.title}</h3>
                                    <div className="item-meta">
                                        <span>{exam.subject}</span>
                                        <span className="dot"></span>
                                        <span className="meta-icon"><Calendar size={14} /> {exam.date}</span>
                                        <span className="dot"></span>
                                        <span className="meta-icon"><Users size={14} /> {exam.students} Students</span>
                                    </div>
                                </div>
                            </div>

                            <div className="item-status">
                                <span className={`status-pill ${exam.status.toLowerCase()}`}>{exam.status}</span>
                                <button className="icon-btn"><MoreVertical size={20} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style>{`
          .manage-exams-page { display: flex; flex-direction: column; gap: 2.5rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; }
          .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
          
          .table-actions { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
          .search-bar { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); flex: 1; max-width: 400px; }
          .search-bar input { background: none; color: var(--text-primary); width: 100%; }
          .filter-group { display: flex; gap: 1rem; }
          .filter-group .active { color: var(--accent); font-weight: 700; }
          
          .exams-inventory { display: flex; flex-direction: column; gap: 1rem; }
          .inventory-item { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; transition: var(--transition-fast); border: 1px solid transparent; }
          .inventory-item:hover { background: var(--surface-low); border-color: var(--border); }
          
          .item-main { display: flex; align-items: center; gap: 2rem; }
          .item-icon { width: 56px; height: 56px; background: var(--surface-high); display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
          
          .item-details h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
          .item-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.8125rem; color: var(--text-muted); }
          .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }
          .meta-icon { display: flex; align-items: center; gap: 0.4rem; }
          
          .item-status { display: flex; align-items: center; gap: 2rem; }
          .status-pill { padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .status-pill.draft { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
          .status-pill.scheduled { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageExams;
