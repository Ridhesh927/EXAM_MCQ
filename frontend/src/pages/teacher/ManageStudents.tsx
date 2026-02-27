import { useState, useEffect, useRef } from 'react';
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
    Loader2
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as XLSX from 'xlsx';

const ManageStudents = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ username: '', email: '', prn_number: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/admin/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.students) {
                setStudents(data.students);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/admin/create-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newStudent)
            });

            if (response.ok) {
                setShowAddModal(false);
                setNewStudent({ username: '', email: '', prn_number: '', password: '' });
                fetchStudents();
            } else {
                alert('Failed to create student');
            }
        } catch (error) {
            console.error('Error creating student', error);
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

                // Map data to expected format (assuming columns: Name, Email, PRN, Password)
                const formattedStudents = data.map((row: any) => ({
                    username: row.Name || row.name || row.Username,
                    email: row.Email || row.email,
                    prn_number: row.PRN || row.prn || row.prn_number,
                    password: row.Password || row.password || 'Student@123' // Default password if missing
                }));

                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/auth/admin/bulk-students', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ students: formattedStudents })
                });

                if (response.ok) {
                    alert(`Successfully imported ${formattedStudents.length} students`);
                    fetchStudents();
                } else {
                    alert('Failed to import students');
                }
            } catch (error) {
                console.error('Error parsing file', error);
                alert('Error parsing file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredStudents = students.filter(student =>
        student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.prn_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <button className="filter-tab active">All Students</button>
                        <button className="filter-tab">Active</button>
                        <button className="filter-tab">Flagged</button>
                    </div>
                </div>

                <div className="students-grid">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin text-accent" size={32} />
                            <p>Loading directory...</p>
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
                                            <span className="status-badge active">
                                                <ShieldCheck size={12} /> Active
                                            </span>
                                            <span className="prn-badge">{student.prn_number}</span>
                                        </div>
                                    </div>
                                    <button className="icon-btn"><MoreHorizontal size={20} /></button>
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
                                    <button className="secondary-action text-error">Restrict Access</button>
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
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            required
                                            className="neo-input"
                                            value={newStudent.password}
                                            onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="neo-btn-primary full-width" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Student Account'}
                                    </button>
                                </form>
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
          .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          
          .card-body { display: flex; flex-direction: column; gap: 0.75rem; }
          .info-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--text-secondary); }
          
          .card-footer { display: flex; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: auto; }
          .secondary-action { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); background: none; transition: var(--transition-fast); cursor: pointer; border: none; }
          .secondary-action:hover { color: var(--accent); }
          .secondary-action.text-error:hover { color: var(--error); }

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
