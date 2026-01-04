import { motion } from 'framer-motion';
import {
    Users,
    ShieldAlert,
    Search,
    Filter,
    Monitor,
    Video,
    VideoOff
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const LiveProctoring = () => {
    const students = [
        { id: 1, name: 'Alice Smith', status: 'secure', focus: 98, device: 'Desktop' },
        { id: 2, name: 'Bob Johnson', status: 'warning', focus: 72, device: 'Laptop' },
        { id: 3, name: 'Charlie Brown', status: 'critical', focus: 45, device: 'Tablet' },
        { id: 4, name: 'Diana Prince', status: 'secure', focus: 95, device: 'Desktop' },
        { id: 5, name: 'Ethan Hunt', status: 'secure', focus: 99, device: 'MacBook' },
        { id: 6, name: 'Fiona Gallagher', status: 'warning', focus: 68, device: 'Desktop' },
    ];

    return (
        <DashboardLayout userType="teacher">
            <div className="proctoring-page">
                <header className="page-header">
                    <div className="header-meta">
                        <h1>Live Invigilation</h1>
                        <div className="active-stats">
                            <div className="stat"><Users size={16} /> 124 Active</div>
                            <div className="stat warn"><ShieldAlert size={16} /> 3 Flagged</div>
                        </div>
                    </div>

                    <div className="header-filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Filter by Name or PRN..." />
                        </div>
                        <button className="icon-btn-outline"><Filter size={18} /></button>
                    </div>
                </header>

                <div className="monitoring-grid">
                    {students.map((student, i) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`proctor-feed neo-card ${student.status}`}
                        >
                            <div className="feed-video">
                                <div className="video-placeholder">
                                    {student.status === 'critical' ? <VideoOff size={48} /> : <Video size={48} />}
                                </div>
                                <div className="feed-overlay">
                                    <span className="device-tag"><Monitor size={12} /> {student.device}</span>
                                    <span className="focus-tag">{student.focus}% Focus</span>
                                </div>
                            </div>

                            <div className="feed-info">
                                <div className="student-brief">
                                    <span className="student-name">{student.name}</span>
                                    <span className="status-label">{student.status}</span>
                                </div>
                                <div className="feed-actions">
                                    <button className="small-btn">View Log</button>
                                    <button className="small-btn warn">Intervene</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <style>{`
          .proctoring-page { display: flex; flex-direction: column; gap: 2.5rem; }
          .page-header { display: flex; align-items: center; justify-content: space-between; }
          .header-meta h1 { font-size: 2.25rem; margin-bottom: 0.5rem; font-family: var(--font-display); }
          .active-stats { display: flex; gap: 1.5rem; font-size: 0.8125rem; font-weight: 700; }
          .stat { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); }
          .stat.warn { color: var(--error); }
          
          .header-filters { display: flex; gap: 1rem; }
          .search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: var(--surface-low); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.875rem; }
          .search-box input { background: none; color: var(--text-primary); border: none; outline: none; }
          .icon-btn-outline { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: var(--radius-sm); background: none; color: var(--text-secondary); }

          .monitoring-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
            gap: 1.5rem; 
            padding-bottom: 2rem;
          }
          .proctor-feed { 
            padding: 0.75rem; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            border: 2px solid transparent !important;
            background: var(--surface-low);
            transition: var(--transition-normal);
          }
          .proctor-feed.warning { border-color: var(--accent) !important; }
          .proctor-feed.critical { border-color: var(--error) !important; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
          
          .feed-video { position: relative; aspect-ratio: 16/9; background: #0c0c0d; border-radius: 4px; overflow: hidden; }
          .video-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--surface); opacity: 0.3; }
          .feed-overlay { position: absolute; top: 0; left: 0; right: 0; padding: 0.75rem; display: flex; justify-content: space-between; background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent); }
          .device-tag, .focus-tag { font-size: 0.625rem; font-weight: 700; color: #fff; text-transform: uppercase; background: rgba(0,0,0,0.5); padding: 0.2rem 0.4rem; border-radius: 2px; display: flex; align-items: center; gap: 0.25rem; }
          
          .feed-info { display: flex; flex-direction: column; gap: 1rem; }
          .student-brief { display: flex; justify-content: space-between; align-items: center; }
          .student-name { font-weight: 700; font-size: 0.9375rem; color: var(--text-primary); }
          .status-label { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: 2px; background: var(--surface-high); }
          .critical .status-label { color: var(--error); background: rgba(239, 68, 68, 0.1); }
          .warning .status-label { color: var(--accent); background: rgba(255, 171, 0, 0.1); }
          .secure .status-label { color: var(--success); background: rgba(16, 185, 129, 0.1); }
          
          .feed-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .small-btn { padding: 0.6rem; font-size: 0.75rem; font-weight: 700; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); border-radius: 4px; transition: var(--transition-fast); }
          .small-btn:hover { background: var(--surface-high); color: var(--text-primary); }
          .small-btn.warn { background: var(--error); color: #fff; border: none; }
          .small-btn.warn:hover { opacity: 0.9; }
        `}</style>
            </div>
        </DashboardLayout>
    );
};

export default LiveProctoring;
