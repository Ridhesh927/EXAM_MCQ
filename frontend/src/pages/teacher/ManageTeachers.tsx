import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    Search,
    FileSpreadsheet,
    X,
    Loader2,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Users
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as XLSX from 'xlsx';
import { TableRowSkeleton } from '../../components/Skeleton';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ username: '', email: '', password: 'Test@123' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importSummary, setImportSummary] = useState<{ success: any[], failed: any[] } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await apiFetch('/api/auth/admin/teachers');
            const data = await response.json();
            if (!response.ok) {
                setFetchError(data.message || `Error ${response.status}`);
            } else if (data.teachers) {
                setTeachers(data.teachers);
            }
        } catch (error: any) {
            setFetchError(error.message || 'Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await apiFetch('/api/auth/admin/create-teacher', {
                method: 'POST',
                body: JSON.stringify(newTeacher)
            });
            if (response.ok) {
                setShowAddModal(false);
                setNewTeacher({ username: '', email: '', password: 'Test@123' });
                fetchTeachers();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to create teacher');
            }
        } catch (error: any) {
            alert(error.message || 'Error creating teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert('The uploaded file is empty.');
                    return;
                }

                const formattedTeachers = data.map((row: any) => ({
                    username: row.Name || row.name || row.Username || row.username,
                    email: row.Email || row.email,
                    password: row.Password || row.password || 'Test@123'
                }));

                const response = await apiFetch('/api/auth/admin/bulk-teachers', {
                    method: 'POST',
                    body: JSON.stringify({ teachers: formattedTeachers })
                });

                const resultData = await response.json();

                if (response.ok) {
                    setImportSummary(resultData.results);
                    fetchTeachers();
                } else {
                    alert(resultData.message || 'Failed to import teachers');
                }
            } catch (error) {
                console.error('Error parsing file', error);
                alert('Error parsing file');
            }

            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const handleToggleBlock = async (teacherId: string, currentStatus: boolean) => {
        try {
            const response = await apiFetch(`/api/auth/admin/user/teacher/${teacherId}/toggle-block`, { method: 'PUT' });
            if (response.ok) {
                setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, is_blocked: !currentStatus } : t));
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to update teacher status');
            }
        } catch (error: any) {
            alert(error.message || 'Error updating teacher status');
        }
    };

    const handleDeleteTeacher = (teacherId: string, teacherName: string) => {
        setDeleteConfirm({ id: teacherId, name: teacherName });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/auth/admin/user/teacher/${deleteConfirm.id}`, { method: 'DELETE' });
            if (response.ok) {
                setTeachers(prev => prev.filter(t => t.id !== deleteConfirm.id));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(deleteConfirm.id);
                    return next;
                });
                setDeleteConfirm(null);
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete teacher');
            }
        } catch (error: any) {
            alert(error.message || 'Error deleting teacher');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        const selectableIds = filteredTeachers
            .filter(t => !t.is_main_admin)
            .map(t => t.id);

        if (selectedIds.size === selectableIds.length && selectableIds.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableIds));
        }
    };

    const toggleSelect = (id: string) => {
        const target = teachers.find(t => t.id === id);
        if (target?.is_main_admin) return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await apiFetch('/api/auth/admin/bulk-delete/teacher', {
                method: 'DELETE',
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (response.ok) {
                setTeachers(prev => prev.filter(t => !selectedIds.has(t.id)));
                setSelectedIds(new Set());
                setShowBulkDeleteConfirm(false);
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete selected teachers');
            }
        } catch (error: any) {
            alert(error.message || 'Error performing bulk deletion');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTeachers = teachers.filter(teacher => 
        teacher.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectableTeachers = filteredTeachers.filter(teacher => !teacher.is_main_admin);

    return (
        <DashboardLayout userType="teacher">
            <div className="students-page">
                <header className="page-header">
                    <div>
                        <h1>Teacher Directory</h1>
                        <p className="text-secondary">Manage teacher accounts and access.</p>
                    </div>
                    <div className="header-actions">
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload}
                        />
                        <a href="/teacher_template.csv" download className="neo-btn-secondary" style={{ textDecoration: 'none' }}>
                            <FileSpreadsheet size={18} /> Template
                        </a>
                        <button className="neo-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                            <FileSpreadsheet size={18} /> Import CSV/Excel
                        </button>
                        {selectedIds.size > 0 && (
                            <button className="neo-btn-delete shadow-sm" onClick={() => setShowBulkDeleteConfirm(true)}>
                                <Trash2 size={18} /> Delete Selected ({selectedIds.size})
                            </button>
                        )}
                        <button className="neo-btn-primary" onClick={() => setShowAddModal(true)}>
                            <UserPlus size={18} /> Add Teacher
                        </button>
                    </div>
                </header>

                <div className="summary-row">
                    <div className="summary-chip">
                        <Users size={16} />
                        <span>Total Teachers: <strong>{teachers.length}</strong></span>
                    </div>
                </div>

                <div className="controls-panel neo-card">
                    <div className="search-row">
                        <div className="search-bar" style={{ maxWidth: '100%' }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="student-list-container neo-card">
                    <div className="list-header" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 0.7fr' }}>
                        <span className="col-checkbox">
                            <input 
                                type="checkbox" 
                                checked={selectableTeachers.length > 0 && selectedIds.size === selectableTeachers.length}
                                onChange={toggleSelectAll}
                                className="neo-checkbox"
                                disabled={selectableTeachers.length === 0}
                            />
                        </span>
                        <span className="col-name">Teacher</span>
                        <span className="col-prn">Email</span>
                        <span className="col-status">Status</span>
                        <span className="col-joined">Joined</span>
                        <span className="col-actions">Actions</span>
                    </div>

                    <div className="list-body">
                        {loading ? (
                            <div className="loading-skeletons">
                                {[1, 2, 3].map(i => <TableRowSkeleton key={i} />)}
                            </div>
                        ) : fetchError ? (
                            <div className="empty-state" style={{ color: '#ef4444' }}>
                                <p>❌ Error loading teachers: {fetchError}</p>
                            </div>
                        ) : filteredTeachers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={40} style={{ opacity: 0.3 }} />
                                <p>No teachers found.</p>
                            </div>
                        ) : (
                            filteredTeachers.map((teacher, i) => (
                                <motion.div
                                    key={teacher.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className={`list-row ${selectedIds.has(teacher.id) ? 'selected' : ''}`}
                                    style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 0.7fr' }}
                                >
                                    <div className="col-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(teacher.id)}
                                            onChange={() => toggleSelect(teacher.id)}
                                            className="neo-checkbox"
                                            disabled={teacher.is_main_admin}
                                        />
                                    </div>
                                    <div className="col-name">
                                        <div className="avatar-sm">{teacher.username.charAt(0).toUpperCase()}</div>
                                        <div className="name-email">
                                            <span className="student-name">{teacher.username}</span>
                                        </div>
                                    </div>
                                    <span className="col-prn">
                                        <code>{teacher.email}</code>
                                    </span>
                                    <span className="col-status">
                                        <span className={`status-pill ${!teacher.is_blocked ? 'active' : 'blocked'}`}>
                                            {!teacher.is_blocked ? 'Active' : 'Blocked'}
                                        </span>
                                    </span>
                                    <span className="col-joined">
                                        {new Date(teacher.created_at).toLocaleDateString('en-IN')}
                                    </span>
                                    <div className="col-actions">
                                        {!teacher.is_main_admin && (
                                            <>
                                                <button
                                                    onClick={() => handleToggleBlock(teacher.id, teacher.is_blocked)}
                                                    className={`action-btn ${!teacher.is_blocked ? 'block-btn' : 'unblock-btn'}`}
                                                    title={!teacher.is_blocked ? 'Block Teacher' : 'Unblock Teacher'}
                                                >
                                                    {!teacher.is_blocked ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher.id, teacher.username)}
                                                    className="action-btn delete-btn"
                                                    title="Delete Teacher"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showAddModal && (
                        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header-simple">
                                    <h2>Add New Teacher</h2>
                                    <button onClick={() => setShowAddModal(false)} className="close-btn"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleAddTeacher} className="modal-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" required className="neo-input" value={newTeacher.username}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" required className="neo-input" value={newTeacher.email}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Temporary Password</label>
                                        <input type="text" required className="neo-input" value={newTeacher.password}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} />
                                    </div>
                                    <button type="submit" className="neo-btn-primary full-width" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Teacher Account'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {deleteConfirm && (
                        <div className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="delete-modal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="delete-icon-wrapper">
                                    <Trash2 size={28} />
                                </div>
                                <h3>Delete Teacher</h3>
                                <p>Are you sure you want to permanently delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
                                <div className="delete-modal-actions">
                                    <button className="cancel-btn" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Cancel</button>
                                    <button className="confirm-delete-btn" onClick={confirmDelete} disabled={isDeleting}>
                                        {isDeleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Delete Teacher</>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                
                <AnimatePresence>
                    {showBulkDeleteConfirm && (
                        <div className="modal-overlay" onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="delete-modal"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="delete-icon-wrapper bulk">
                                    <Trash2 size={28} />
                                </div>
                                <h3>Delete {selectedIds.size} Teachers</h3>
                                <p>Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected teachers?</p>
                                <div className="delete-modal-actions">
                                    <button className="cancel-btn" onClick={() => setShowBulkDeleteConfirm(false)} disabled={isDeleting}>Cancel</button>
                                    <button className="confirm-delete-btn" onClick={handleBulkDelete} disabled={isDeleting}>
                                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                
                <AnimatePresence>
                    {importSummary && (
                        <div className="modal-overlay" onClick={() => setImportSummary(null)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                style={{ maxWidth: '600px' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header-simple">
                                    <h2>Import Results</h2>
                                    <button onClick={() => setImportSummary(null)} className="close-btn"><X size={20} /></button>
                                </div>
                                <div className="import-stats">
                                    <div className="import-stat success">
                                        <h3>{importSummary.success.length}</h3>
                                        <span>Successfully Added</span>
                                    </div>
                                    <div className="import-stat error">
                                        <h3>{importSummary.failed.length}</h3>
                                        <span>Failed</span>
                                    </div>
                                </div>
                                <button onClick={() => setImportSummary(null)} className="neo-btn-primary full-width" style={{ marginTop: '1.5rem' }}>
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style>{`
                  .students-page { display: flex; flex-direction: column; gap: 1.5rem; }
                  .page-header { display: flex; justify-content: space-between; align-items: center; }
                  .page-header h1 { font-size: 2.25rem; margin-bottom: 0.5rem; font-family: var(--font-display); }
        
                  .header-actions { display: flex; gap: 0.75rem; }
                  .neo-btn-secondary { display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 1.1rem; background: var(--surface-low); border: 1px solid var(--border); color: var(--text-primary); font-weight: 600; font-size: 0.8125rem; border-radius: var(--radius-sm); transition: var(--transition-fast); cursor: pointer; }
                  .neo-btn-secondary:hover { background: var(--surface-high); }
        
                  .summary-row { display: flex; gap: 1rem; }
                  .summary-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--surface-low); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--text-secondary); }
                  .summary-chip strong { color: var(--text-primary); }
        
                  .controls-panel { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; background: var(--surface-low); }
                  .search-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; width: 100%; }
                  .search-bar { display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); flex: 1; background: var(--surface-high); padding: 0.6rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border); }
                  .search-bar input { background: none; color: var(--text-primary); border: none; outline: none; width: 100%; font-size: 0.875rem; }
        
                  .student-list-container { padding: 0; overflow: hidden; background: var(--surface-low); }
                  .list-header { display: grid; padding: 0.9rem 1.5rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border); font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
                  .list-body { max-height: 520px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--surface-high) transparent; }
                  .list-body::-webkit-scrollbar { width: 6px; }
                  .list-body::-webkit-scrollbar-track { background: transparent; }
                  .list-body::-webkit-scrollbar-thumb { background: var(--surface-high); border-radius: 3px; }
        
                  .list-row { display: grid; padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--border); align-items: center; transition: background 0.15s ease; }
                  .list-row:last-child { border-bottom: none; }
                  .list-row:hover { background: rgba(255,255,255,0.02); }
        
                  .col-name { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
                  .avatar-sm { width: 36px; height: 36px; min-width: 36px; background: var(--surface-high); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; color: var(--accent); }
                  .name-email { display: flex; flex-direction: column; min-width: 0; }
                  .student-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
                  .col-prn code { font-size: 0.8125rem; background: var(--surface-high); padding: 0.15rem 0.5rem; border-radius: 4px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
                  .col-status { font-size: 0.8125rem; }
                  .col-joined { font-size: 0.8125rem; color: var(--text-secondary); }
                  .col-actions { display: flex; gap: 0.35rem; }

                  .status-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
                  .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                  .status-pill.blocked { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
                  .action-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; background: var(--surface-high); color: var(--text-muted); }
                  .action-btn:hover { color: var(--text-primary); }
                  .block-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
                  .unblock-btn:hover { background: rgba(16, 185, 129, 0.15); color: #10b981; }
                  .delete-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        
                  .col-checkbox { display: flex; align-items: center; justify-content: center; width: 40px; }
                  .neo-checkbox { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface-high); cursor: pointer; accent-color: var(--accent); }
                  .list-row.selected { background: rgba(255, 255, 255, 0.05); }
                  
                  .neo-btn-delete { display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 1.1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; font-weight: 600; font-size: 0.8125rem; border-radius: var(--radius-sm); transition: var(--transition-fast); cursor: pointer; }
                  .neo-btn-delete:hover { background: rgba(239, 68, 68, 0.2); }
                  
                  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: var(--text-muted); gap: 0.75rem; text-align: center; }
                  .empty-state p { font-size: 0.9375rem; margin: 0; }
        
                  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 1rem; }
                  .modal-content { background: var(--bg); border: 1px solid var(--border); width: 100%; max-width: 480px; border-radius: var(--radius-md); padding: 2rem; }
                  .modal-header-simple { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                  .modal-header-simple h2 { margin: 0; font-size: 1.375rem; }
                  .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; }
                  
                  .delete-modal { background: var(--bg); border: 1px solid var(--border); width: 100%; max-width: 420px; border-radius: var(--radius-md); padding: 2.5rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
                  .delete-icon-wrapper { width: 64px; height: 64px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
                  .delete-icon-wrapper.bulk { background: rgba(239, 68, 68, 0.2); }
                  .delete-modal h3 { font-size: 1.5rem; margin: 0; color: var(--text-primary); }
                  .delete-modal p { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.5; margin: 0; }
                  .delete-modal-actions { display: flex; gap: 1rem; width: 100%; margin-top: 1.5rem; }
                  .cancel-btn, .confirm-delete-btn { flex: 1; padding: 0.75rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; border: none; }
                  .cancel-btn { background: var(--surface-high); color: var(--text-primary); }
                  .confirm-delete-btn { background: #ef4444; color: white; }
                  
                  .modal-form { display: flex; flex-direction: column; gap: 1rem; }
                  .form-group { display: flex; flex-direction: column; gap: 0.4rem; justify-content: flex-start; text-align: left; }
                  .form-group label { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600; }
                  .neo-input { background: var(--surface-low); border: 1px solid var(--border); padding: 0.7rem 0.85rem; border-radius: var(--radius-sm); color: var(--text-primary); font-size: 0.875rem; }
                  .full-width { width: 100%; justify-content: center; margin-top: 0.5rem; }

                  .import-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
                  .import-stat { flex: 1; padding: 1.25rem; border-radius: 8px; }
                  .import-stat.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); }
                  .import-stat.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
                  .import-stat h3 { font-size: 2rem; margin: 0; }
                  .import-stat.success h3 { color: #10b981; }
                  .import-stat.error h3 { color: #ef4444; }
                  .import-stat span { font-size: 0.8125rem; color: var(--text-muted); }
                `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageTeachers;
