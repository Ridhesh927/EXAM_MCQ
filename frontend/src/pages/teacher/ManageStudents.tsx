import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    Search,
    MoreHorizontal,
    Mail,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    FileSpreadsheet,
    X,
    Loader2,
    Trash2
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as XLSX from 'xlsx';

const ManageStudents = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ username: '', email: '', prn_number: '', password: 'student@123', department: '', year: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [importSummary, setImportSummary] = useState<{ success: any[], failed: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await apiFetch('/api/auth/admin/students');
            const data = await response.json();
            if (!response.ok) {
                setFetchError(data.message || `Error ${response.status}`);
            } else if (data.students) {
                setStudents(data.students);
            }
        } catch (error: any) {
            setFetchError(error.message || 'Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await apiFetch('/api/auth/admin/create-student', {
                method: 'POST',
                body: JSON.stringify(newStudent)
            });
            if (response.ok) {
                setShowAddModal(false);
                setNewStudent({ username: '', email: '', prn_number: '', password: 'student@123', department: '', year: '' });
                fetchStudents();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to create student');
            }
        } catch (error: any) {
            alert(error.message || 'Error creating student');
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

                // Check for required headers in the first row
                const firstRow: any = data[0];
                const hasName = 'Name' in firstRow || 'name' in firstRow || 'Username' in firstRow || 'username' in firstRow;
                const hasEmail = 'Email' in firstRow || 'email' in firstRow;
                const hasPRN = 'PRN' in firstRow || 'prn' in firstRow || 'prn_number' in firstRow;

                if (!hasName || !hasEmail || !hasPRN) {
                    alert('Invalid CSV format. Please ensure the file has at least Name, Email, and PRN columns.');
                    return;
                }

                // Map data to expected format
                const formattedStudents = data.map((row: any) => ({
                    username: row.Name || row.name || row.Username || row.username,
                    email: row.Email || row.email,
                    prn_number: row.PRN || row.prn || row.prn_number,
                    password: row.Password || row.password || 'student@123', // Default password if missing
                    department: row.Department || row.department || '',
                    year: row.Year || row.year || ''
                }));

                const response = await apiFetch('/api/auth/admin/bulk-students', {
                    method: 'POST',
                    body: JSON.stringify({ students: formattedStudents })
                });

                const resultData = await response.json();

                if (response.ok) {
                    setImportSummary(resultData.results);
                    fetchStudents();
                } else {
                    alert(resultData.message || 'Failed to import students');
                }
            } catch (error) {
                console.error('Error parsing file', error);
                alert('Error parsing file');
            }

            // Reset the file input so the same file can be uploaded again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const handleToggleBlock = async (studentId: string, currentStatus: boolean) => {
        try {
            const response = await apiFetch(`/api/auth/admin/user/student/${studentId}/toggle-block`, { method: 'PUT' });
            if (response.ok) {
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_blocked: !currentStatus } : s));
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to update student status');
            }
        } catch (error: any) {
            alert(error.message || 'Error updating student status');
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return;
        try {
            const response = await apiFetch(`/api/auth/admin/user/student/${studentId}`, { method: 'DELETE' });
            if (response.ok) {
                setStudents(prev => prev.filter(s => s.id !== studentId));
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete student');
            }
        } catch (error: any) {
            alert(error.message || 'Error deleting student');
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.prn_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' ||
            (statusFilter === 'Active' && !student.is_blocked) ||
            (statusFilter === 'Blocked' && student.is_blocked);
        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout userType="teacher">
            <div className="students-page">
                <header className="page-header">
                    <div>
                        <h1>Student Directory</h1>
                        <p className="text-secondary">Manage enrollment and academic access privileges.</p>
                    </div>
                    <div className="header-actions">
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload}
                        />
                        <a href="/student_template.csv" download className="neo-btn-secondary" style={{ textDecoration: 'none' }}>
                            <FileSpreadsheet size={18} /> Template
                        </a>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload}
                        />
                        <button className="neo-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                            <FileSpreadsheet size={18} /> Import CSV/Excel
                        </button>
                        <button className="neo-btn-primary" onClick={() => setShowAddModal(true)}>
                            <UserPlus size={18} /> Add Student
                        </button>
                    </div>
                </header>

                <div className="table-actions neo-card">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <button className={`filter-tab ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => setStatusFilter('All')}>All Students</button>
                        <button className={`filter-tab ${statusFilter === 'Active' ? 'active' : ''}`} onClick={() => setStatusFilter('Active')}>Active</button>
                        <button className={`filter-tab ${statusFilter === 'Blocked' ? 'active' : ''}`} onClick={() => setStatusFilter('Blocked')}>Blocked</button>
                    </div>
                </div>

                <div className="students-grid">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <p>Loading directory...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="empty-state" style={{ color: '#ef4444' }}>
                            <p>❌ Error loading students: {fetchError}</p>
                            <p style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Check browser console (F12) for details.</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="empty-state">
                            <p>No students found.</p>
                        </div>
                    ) : (
                        filteredStudents.map((student, i) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="student-card neo-card"
                            >
                                <div className="card-header">
                                    <div className="avatar-large">{student.username.charAt(0).toUpperCase()}</div>
                                    <div className="header-info">
                                        <h3>{student.username}</h3>
                                        <div className="badges">
                                            <span className={`status-badge ${!student.is_blocked ? 'active' : 'blocked'}`}>
                                                {!student.is_blocked ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                                {!student.is_blocked ? 'Active' : 'Blocked'}
                                            </span>
                                            <span className="prn-badge">{student.prn_number}</span>
                                            {student.department && <span className="dept-badge">{student.department}</span>}
                                            {student.year && <span className="prn-badge">{student.year}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteStudent(student.id)} className="icon-btn delete-student-btn" title="Delete Student">
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="card-body">
                                    <div className="info-item">
                                        <Mail size={16} />
                                        <span>{student.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={16} />
                                        <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <button className="secondary-action">View Profile</button>
                                    <button
                                        onClick={() => handleToggleBlock(student.id, student.is_blocked)}
                                        className={`secondary-action ${!student.is_blocked ? 'text-error' : 'text-success'}`}
                                    >
                                        {!student.is_blocked ? 'Restrict Access' : 'Restore Access'}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Add Student Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="modal-overlay">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                            >
                                <div className="modal-header-simple">
                                    <h2>Add New Student</h2>
                                    <button onClick={() => setShowAddModal(false)} className="close-btn"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleAddStudent} className="modal-form">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="neo-input"
                                            value={newStudent.username}
                                            onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="neo-input"
                                            value={newStudent.email}
                                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>PRN Number</label>
                                        <input
                                            type="text"
                                            required
                                            className="neo-input"
                                            value={newStudent.prn_number}
                                            onChange={(e) => setNewStudent({ ...newStudent, prn_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <select
                                            required
                                            className="neo-input"
                                            value={newStudent.department}
                                            onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                                        >
                                            <option value="">Select Department</option>
                                            <option>Computer Science (CSE)</option>
                                            <option>Information Technology (IT)</option>
                                            <option>Electronics & Telecom (ENTC)</option>
                                            <option>Mechanical Engineering</option>
                                            <option>Civil Engineering</option>
                                            <option>Electrical Engineering</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Year</label>
                                        <select
                                            required
                                            className="neo-input"
                                            value={newStudent.year}
                                            onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                                        >
                                            <option value="">Select Year</option>
                                            <option>First Year</option>
                                            <option>Second Year</option>
                                            <option>Third Year</option>
                                            <option>Fourth Year</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="neo-btn-primary full-width" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Student Account'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Import Summary Modal */}
                <AnimatePresence>
                    {importSummary && (
                        <div className="modal-overlay">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="modal-content"
                                style={{ maxWidth: '600px' }}
                            >
                                <div className="modal-header-simple">
                                    <h2>Import Results</h2>
                                    <button onClick={() => setImportSummary(null)} className="close-btn"><X size={20} /></button>
                                </div>
                                <div className="summary-stats" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="stat-box success" style={{ flex: 1, padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <h3 style={{ color: '#10b981', margin: 0, fontSize: '2rem' }}>{importSummary.success.length}</h3>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Successfully Added</span>
                                    </div>
                                    <div className="stat-box error" style={{ flex: 1, padding: '1.25rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        <h3 style={{ color: '#ef4444', margin: 0, fontSize: '2rem' }}>{importSummary.failed.length}</h3>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Failed</span>
                                    </div>
                                </div>

                                <div className="summary-lists" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                                    {importSummary.failed.length > 0 && (
                                        <div className="failed-list">
                                            <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <ShieldAlert size={18} /> Failed Rows
                                            </h4>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {importSummary.failed.map((f: any, i: number) => (
                                                    <li key={i} style={{ padding: '0.75rem 1rem', background: 'var(--surface-high)', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid #ef4444' }}>
                                                        <strong style={{ color: 'var(--text-primary)' }}>{f.student.username || f.student.email || 'Unknown'}</strong>
                                                        <span style={{ color: 'var(--text-secondary)' }}>Reason: {f.reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {importSummary.success.length > 0 && (
                                        <div className="success-list">
                                            <h4 style={{ color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <ShieldCheck size={18} /> Added Successfully
                                            </h4>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {importSummary.success.map((s: any, i: number) => (
                                                    <li key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-high)', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                                                        {s.username} <span style={{ color: 'var(--text-muted)' }}>({s.prn_number})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => setImportSummary(null)} className="neo-btn-primary full-width" style={{ marginTop: '2rem' }}>
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <style>{`
          .students-page { display: flex; flex-direction: column; gap: 2rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; }
          .page-header h1 { font-size: 2.25rem; margin-bottom: 0.5rem; font-family: var(--font-display); }
          
          .header-actions { display: flex; gap: 1rem; }
          .neo-btn-secondary { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: var(--surface-low); border: 1px solid var(--border); color: var(--text-primary); font-weight: 700; font-size: 0.875rem; border-radius: var(--radius-sm); transition: var(--transition-fast); cursor: pointer; }
          .neo-btn-secondary:hover { background: var(--surface-high); }
          
          .table-actions { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: var(--surface-low); }
          .search-bar { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); flex: 1; max-width: 400px; }
          .search-bar input { background: none; color: var(--text-primary); border: none; outline: none; width: 100%; font-size: 0.875rem; }
          
          .students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; padding-bottom: 2rem; }
          .loading-state, .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: var(--text-muted); gap: 1rem; }
          
          .student-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: var(--surface-low); }
          
          .card-header { display: flex; align-items: center; gap: 1.25rem; }
          .avatar-large { width: 56px; height: 56px; background: var(--surface-high); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: var(--accent); }
          .header-info { flex: 1; }
          .header-info h3 { font-size: 1.125rem; margin-bottom: 0.25rem; color: var(--text-primary); }
          
          .badges { display: flex; gap: 0.5rem; align-items: center; }
          .prn-badge { font-size: 0.625rem; background: var(--surface); padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--text-muted); font-family: monospace; }
          .dept-badge { font-size: 0.625rem; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); padding: 0.2rem 0.5rem; border-radius: 4px; color: #f97316; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
          .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .status-badge.blocked { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          
          .card-body { display: flex; flex-direction: column; gap: 0.75rem; }
          .info-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--text-secondary); }
          
          .card-footer { display: flex; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: auto; }
          .secondary-action { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); background: none; transition: var(--transition-fast); cursor: pointer; border: none; }
          .secondary-action:hover { color: var(--accent); }
          .secondary-action.text-error:hover { color: var(--error); }
          .text-success { color: #10b981 !important; }
          .text-success:hover { color: #059669 !important; }
          
          .delete-student-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
          .delete-student-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

          /* Modal Styles */
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: center; align-items: center; }
          .modal-content { background: var(--bg); border: 1px solid var(--border); width: 100%; max-width: 450px; border-radius: var(--radius-md); padding: 2rem; }
          .modal-header-simple { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
          .modal-header-simple h2 { margin: 0; font-size: 1.5rem; }
          .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
          .close-btn:hover { color: var(--text-primary); }
          .modal-form { display: flex; flex-direction: column; gap: 1rem; }
          .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
          .form-group label { font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; }
          .neo-input { background: var(--surface-low); border: 1px solid var(--border); padding: 0.75rem; border-radius: var(--radius-sm); color: var(--text-primary); }
          .neo-input:focus { border-color: var(--accent); outline: none; }
          .full-width { width: 100%; justify-content: center; margin-top: 1rem; }

          @media (max-width: 768px) {
            .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
            .header-actions { width: 100%; flex-direction: column; }
            .header-actions button { width: 100%; justify-content: center; }
          }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageStudents;
