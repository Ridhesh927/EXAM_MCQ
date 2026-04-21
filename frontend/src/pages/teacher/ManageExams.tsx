import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    MoreVertical,
    Calendar,
    Layers,
    Trash2,
    Edit,
    Clock,
    BrainCircuit
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { CardSkeleton } from '../../components/Skeleton';
import { getUser } from '../../utils/auth';

const ManageExams = () => {
    const navigate = useNavigate();
    const user = getUser('teacher');
    const isMainAdmin = user?.isMainAdmin;
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [examToSchedule, setExamToSchedule] = useState<string | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await apiFetch('/api/exams/teacher/my-exams');
            const data = await response.json();
            if (Array.isArray(data)) {
                setExams(data);
            }
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.subject.toLowerCase().includes(searchQuery.toLowerCase());

        const isScheduledActive = exam.status === 'Scheduled' && exam.scheduled_start && new Date(exam.scheduled_start) <= new Date();
        const isScheduledFuture = exam.status === 'Scheduled' && (!exam.scheduled_start || new Date(exam.scheduled_start) > new Date());

        const matchesStatus = statusFilter === 'All' ||
            (statusFilter === 'Active' && (exam.status === 'Published' || isScheduledActive)) ||
            (statusFilter === 'Draft' && exam.status === 'Draft') ||
            (statusFilter === 'Completed' && exam.status === 'Completed') ||
            (statusFilter === 'Scheduled' && isScheduledFuture);
        return matchesSearch && matchesStatus;
    });

    const handleDelete = (examId: string) => {
        setExamToDelete(examId);
        setShowDeleteModal(true);
        setActiveMenu(null);
    };

    const confirmDelete = async () => {
        if (!examToDelete) return;
        try {
            const response = await apiFetch(`/api/exams/teacher/delete/${examToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                setExams(prev => prev.filter(e => e.id !== examToDelete));
            } else {
                alert('Failed to delete exam.');
            }
        } catch (err) {
            alert('Error deleting exam.');
        } finally {
            setShowDeleteModal(false);
            setExamToDelete(null);
        }
    };

    const handleSchedule = (examId: string) => {
        setExamToSchedule(examId);
        setShowScheduleModal(true);
        setActiveMenu(null);
    };

    const confirmSchedule = async () => {
        if (!examToSchedule || !scheduleDate) return;
        try {
            const response = await apiFetch(`/api/exams/teacher/schedule/${examToSchedule}`, {
                method: 'PUT',
                body: JSON.stringify({ scheduled_start: scheduleDate })
            });
            if (response.ok) {
                const data = await response.json();
                setExams(prev => prev.map(e => e.id === examToSchedule ? { ...e, status: data.status, scheduled_start: data.scheduled_start } : e));
            } else {
                alert('Failed to schedule exam.');
            }
        } catch (err) {
            alert('Error scheduling exam.');
        } finally {
            setShowScheduleModal(false);
            setExamToSchedule(null);
            setScheduleDate('');
        }
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
                        {['All', 'Active', 'Draft', 'Scheduled', 'Completed'].map(status => (
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
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div className="empty-state">
                            <p>No exams found.</p>
                        </div>
                    ) : (
                        filteredExams.map((exam, i) => (
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
                                            <span className="meta-icon">
                                                <Calendar size={14} />
                                                {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                            {exam.created_by && (
                                                <><span className="dot"></span>
                                                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>by {exam.created_by}</span></>
                                            )}
                                            {exam.target_department && (
                                                <><span className="dot"></span>
                                                    <span>{exam.target_department} · {exam.target_year || 'All Years'}</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="item-status">
                                    {(() => {
                                        const isActive = exam.status === 'Published' || (exam.status === 'Scheduled' && exam.scheduled_start && new Date(exam.scheduled_start) <= new Date());
                                        const isCompleted = exam.status === 'Completed';
                                        const badgeClass = isCompleted ? 'completed' : (isActive ? 'published' : (exam.status ? exam.status.toLowerCase() : 'draft'));
                                        const displayText = isCompleted ? 'Completed' : (isActive ? 'Active' : (exam.status || 'Draft'));
                                        return (
                                            <span className={`status-pill ${badgeClass}`}>
                                                {displayText}
                                            </span>
                                        );
                                    })()}
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
                                                    {(exam.teacher_id === user?.id || isMainAdmin) && (
                                                        <>
                                                            <button onClick={() => handleEdit(exam.id)} className="dropdown-item">
                                                                <Edit size={16} /> Edit Exam
                                                            </button>
                                                            <button
                                                                onClick={() => handleSchedule(exam.id)}
                                                                className="dropdown-item"
                                                            >
                                                                <Clock size={16} /> {(exam.status === 'Scheduled' && (!exam.scheduled_start || new Date(exam.scheduled_start) > new Date())) ? 'Reschedule' : 'Schedule'}
                                                            </button>
                                                            <button onClick={() => navigate(`/teacher/exam-health/${exam.id}`)} className="dropdown-item">
                                                                <BrainCircuit size={16} style={{ color: 'var(--accent)' }} /> <strong>Health & Insights</strong>
                                                            </button>
                                                            <div className="dropdown-divider"></div>
                                                            <button onClick={() => handleDelete(exam.id)} className="dropdown-item danger">
                                                                <Trash2 size={16} /> Delete Exam
                                                            </button>
                                                        </>
                                                    )}
                                                    {exam.teacher_id !== user?.id && !isMainAdmin && (
                                                        <button className="dropdown-item" disabled>
                                                            <Edit size={16} /> View Only
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
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
                                    <h2>Archive Exam?</h2>
                                    <p>The exam will be removed from active lists, but all associated results and analytics will be preserved for future reference.</p>
                                </div>
                                <div className="modal-actions">
                                    <button onClick={() => setShowDeleteModal(false)} className="modal-btn modal-btn-cancel">
                                        Cancel
                                    </button>
                                    <button onClick={confirmDelete} className="modal-btn modal-btn-delete">
                                        <Trash2 size={18} /> Archive Exam
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Schedule Modal */}
                <AnimatePresence>
                    {showScheduleModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay"
                            onClick={() => setShowScheduleModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <Clock size={48} className="text-accent" />
                                    <h2>Schedule Exam</h2>
                                    <p>Select when this exam should become available to students.</p>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Start Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="neo-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)' }}
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button onClick={() => setShowScheduleModal(false)} className="modal-btn modal-btn-cancel">
                                        Cancel
                                    </button>
                                    <button onClick={confirmSchedule} className="modal-btn" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
                                        <Clock size={18} /> Confirm Schedule
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
          .status-pill.active, .status-pill.published { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .status-pill.draft { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
          .status-pill.scheduled { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
          .status-pill.completed { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
          
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
