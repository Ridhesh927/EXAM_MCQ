import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    MoreVertical,
    Users,
    Calendar,
    Layers,
    Trash2,
    Edit,
    Clock
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const ManageExams = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);

    const exams = [
        { id: '1', title: 'Advanced Thermodynamics', subject: 'Physics', students: 42, date: '2025-05-12', status: 'Active' },
        { id: '2', title: 'Digital Logic Design', subject: 'CS', students: 128, date: '2025-05-15', status: 'Draft' },
        { id: '3', title: 'Renaissance Art History', subject: 'History', students: 56, date: '2025-05-18', status: 'Scheduled' },
    ];

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || exam.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = (examId: string) => {
        setExamToDelete(examId);
        setShowDeleteModal(true);
        setActiveMenu(null);
    };

    const confirmDelete = () => {
        console.log('Deleting exam:', examToDelete);
        // TODO: API call to delete exam
        setShowDeleteModal(false);
        setExamToDelete(null);
    };

    const handleSchedule = (examId: string) => {
        console.log('Scheduling exam:', examId);
        // TODO: Open schedule modal
        setActiveMenu(null);
    };

    const handleEdit = (examId: string) => {
        navigate(`/teacher/edit-exam/${examId}`);
        setActiveMenu(null);
    };

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
                        <input
                            type="text"
                            placeholder="Search by title or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        {['All', 'Active', 'Draft', 'Scheduled'].map(status => (
                            <button
                                key={status}
                                className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === 'Draft' ? 'Drafts' : status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="exams-inventory">
                    {filteredExams.map((exam, i) => (
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
                                <div className="action-menu-wrapper">
                                    <button
                                        className="icon-btn"
                                        onClick={() => setActiveMenu(activeMenu === exam.id ? null : exam.id)}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    <AnimatePresence>
                                        {activeMenu === exam.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="action-dropdown"
                                            >
                                                <button onClick={() => handleEdit(exam.id)} className="dropdown-item">
                                                    <Edit size={16} /> Edit Exam
                                                </button>
                                                <button
                                                    onClick={() => handleSchedule(exam.id)}
                                                    className="dropdown-item"
                                                    disabled={exam.status === 'Scheduled'}
                                                >
                                                    <Clock size={16} /> {exam.status === 'Scheduled' ? 'Reschedule' : 'Schedule'}
                                                </button>
                                                <div className="dropdown-divider"></div>
                                                <button onClick={() => handleDelete(exam.id)} className="dropdown-item danger">
                                                    <Trash2 size={16} /> Delete Exam
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <Trash2 size={48} className="text-error" />
                                    <h2>Delete Exam?</h2>
                                    <p>This action cannot be undone. All exam data, student submissions, and results will be permanently deleted.</p>
                                </div>
                                <div className="modal-actions">
                                    <button onClick={() => setShowDeleteModal(false)} className="modal-btn modal-btn-cancel">
                                        Cancel
                                    </button>
                                    <button onClick={confirmDelete} className="modal-btn modal-btn-delete">
                                        <Trash2 size={18} /> Delete Permanently
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style>{`
          .manage-exams-page { display: flex; flex-direction: column; gap: 2.5rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; }
          .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
          
          .table-actions { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
          .search-bar { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); flex: 1; max-width: 400px; }
          .search-bar input { background: none; color: var(--text-primary); width: 100%; border: none; outline: none; }
          
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
          
          /* Action Menu */
          .action-menu-wrapper {
            position: relative;
          }
          
          .action-dropdown {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            background: var(--surface-low);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            min-width: 180px;
            z-index: 100;
            overflow: hidden;
          }
          
          .dropdown-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: 0.875rem;
            cursor: pointer;
            transition: background 0.2s ease;
            text-align: left;
          }
          
          .dropdown-item:hover:not(:disabled) {
            background: var(--surface);
          }
          
          .dropdown-item:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .dropdown-item.danger {
            color: var(--error);
          }
          
          .dropdown-item.danger:hover {
            background: rgba(239, 68, 68, 0.1);
          }
          
          .dropdown-divider {
            height: 1px;
            background: var(--border);
            margin: 0.25rem 0;
          }
          
          /* Delete Modal */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 2rem;
          }
          
          .modal-content {
            background: var(--surface-low);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            max-width: 480px;
            width: 100%;
            padding: 2.5rem;
          }
          
          .modal-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .modal-header h2 {
            font-size: 1.5rem;
            margin: 0;
          }
          
          .modal-header p {
            color: var(--text-muted);
            font-size: 0.9375rem;
            line-height: 1.6;
            margin: 0;
          }
          
          .modal-actions {
            display: flex;
            gap: 1rem;
          }
          
          .modal-btn {
            flex: 1;
            padding: 0.875rem 1.5rem;
            border-radius: var(--radius-sm);
            font-weight: 600;
            font-size: 0.9375rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          
          .modal-btn-cancel {
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--text-primary);
          }
          
          .modal-btn-cancel:hover {
            background: var(--surface-high);
          }
          
          .modal-btn-delete {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          
          .modal-btn-delete:hover {
            box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageExams;
