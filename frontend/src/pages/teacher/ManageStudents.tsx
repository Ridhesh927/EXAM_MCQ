import { motion } from 'framer-motion';
import {
    UserPlus,
    Search,
    MoreHorizontal,
    Mail,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    FileSpreadsheet
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ManageStudents = () => {
    const students = [
        { id: '1', name: 'Albus Dumbledore', email: 'albus@hogwarts.edu', joined: '2024-09-01', status: 'Active', exams: 12 },
        { id: '2', name: 'Minerva McGonagall', email: 'minerva@hogwarts.edu', joined: '2024-09-02', status: 'Active', exams: 15 },
        { id: '3', name: 'Severus Snape', email: 'severus@hogwarts.edu', joined: '2024-09-05', status: 'Suspended', exams: 10 },
        { id: '4', name: 'Rubeus Hagrid', email: 'hagrid@hogwarts.edu', joined: '2024-09-10', status: 'Active', exams: 5 },
    ];

    return (
        <DashboardLayout userType="teacher">
            <div className="students-page">
                <header className="page-header">
                    <div>
                        <h1>Student Directory</h1>
                        <p className="text-secondary">Manage enrollment and academic access privileges.</p>
                    </div>
                    <div className="header-actions">
                        <button className="neo-btn-secondary">
                            <FileSpreadsheet size={18} /> Import CSV/Excel
                        </button>
                        <button className="neo-btn-primary">
                            <UserPlus size={18} /> Add Student
                        </button>
                    </div>
                </header>

                <div className="table-actions neo-card">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Search by name, email or ID..." />
                    </div>
                    <div className="filter-group">
                        <button className="text-btn active">All Students</button>
                        <button className="text-btn">Active</button>
                        <button className="text-btn">Flagged</button>
                    </div>
                </div>

                <div className="students-grid">
                    {students.map((student, i) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="student-card neo-card"
                        >
                            <div className="card-header">
                                <div className="avatar-large">{student.name.split(' ').map(n => n[0]).join('')}</div>
                                <div className="header-info">
                                    <h3>{student.name}</h3>
                                    <span className={`status-badge ${student.status.toLowerCase()}`}>
                                        {student.status === 'Active' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                        {student.status}
                                    </span>
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
                                    <span>Joined {student.joined}</span>
                                </div>
                                <div className="info-item">
                                    <ShieldCheck size={16} />
                                    <span>{student.exams} Assessments Completed</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button className="secondary-action">View Profile</button>
                                <button className="secondary-action text-error">Restrict Access</button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style>{`
          .students-page { display: flex; flex-direction: column; gap: 2rem; }
          .page-header { display: flex; justify-content: space-between; align-items: center; }
          .page-header h1 { font-size: 2.25rem; margin-bottom: 0.5rem; font-family: var(--font-display); }
          
          .header-actions { display: flex; gap: 1rem; }
          .neo-btn-secondary { 
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            padding: 0.75rem 1.25rem; 
            background: var(--surface-low); 
            border: 1px solid var(--border); 
            color: var(--text-primary); 
            font-weight: 700; 
            font-size: 0.875rem; 
            border-radius: var(--radius-sm);
            transition: var(--transition-fast);
          }
          .neo-btn-secondary:hover { background: var(--surface-high); }

          .table-actions { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: var(--surface-low); }
          .search-bar { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); flex: 1; max-width: 400px; }
          .search-bar input { background: none; color: var(--text-primary); border: none; outline: none; width: 100%; font-size: 0.875rem; }
          .filter-group { display: flex; gap: 1.5rem; }
          .filter-group .text-btn { font-size: 0.875rem; color: var(--text-muted); }
          .filter-group .active { color: var(--accent); font-weight: 700; }
          
          .students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; padding-bottom: 2rem; }
          .student-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: var(--surface-low); }
          
          .card-header { display: flex; align-items: center; gap: 1.25rem; }
          .avatar-large { width: 56px; height: 56px; background: var(--surface-high); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.125rem; font-weight: 700; color: var(--accent); }
          .header-info { flex: 1; }
          .header-info h3 { font-size: 1.125rem; margin-bottom: 0.25rem; color: var(--text-primary); }
          
          .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
          .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .status-badge.suspended { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          
          .card-body { display: flex; flex-direction: column; gap: 0.75rem; }
          .info-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--text-secondary); }
          
          .card-footer { display: flex; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.25rem; margin-top: auto; }
          .secondary-action { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); background: none; transition: var(--transition-fast); }
          .secondary-action:hover { color: var(--accent); }
          .secondary-action.text-error:hover { color: var(--error); }

          @media (max-width: 768px) {
            .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
            .header-actions { width: 100%; flex-direction: column; }
            .header-actions button { width: 100%; justify-content: center; }
            .table-actions { flex-direction: column; gap: 1.5rem; align-items: flex-start; }
          }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default ManageStudents;
