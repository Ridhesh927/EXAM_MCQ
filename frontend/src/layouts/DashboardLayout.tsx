import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  Bell,
  ShieldAlert,
  TrendingUp,
  Settings
} from 'lucide-react';
import { getUser, clearAuth } from '../utils/auth';



interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'student' | 'teacher';
}



const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(userType === 'student' ? 'Scholar Name' : 'Instructor Name');

  useEffect(() => {
    const user = getUser(userType);
    if (user?.name) setUserName(user.name);
    else if (user?.username) setUserName(user.username);
  }, [userType]);

  const handleLogout = () => {
    clearAuth(userType);
    navigate('/login');
  };

  const navItems = userType === 'student' ? [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/student/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Available Exams', path: '/student/exams' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/student/settings' },
  ] : [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Manage Exams', path: '/teacher/exams' },
    { icon: <ShieldAlert size={20} />, label: 'Live Proctoring', path: '/teacher/proctor' },
    { icon: <TrendingUp size={20} />, label: 'View Results', path: '/teacher/results' },
    { icon: <Users size={20} />, label: 'Students', path: '/teacher/students' },
  ];

  return (
    <div className="dashboard-root">

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot"></div>
          <span>Online Examination</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="header-search">
            <span className="text-muted">Academic Session: 2025-26</span>
          </div>
          <div className="header-actions">
            {userType === 'teacher' && (
              <button className="icon-btn">
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>
            )}
            <div className="user-profile-brief">
              <div className="avatar-placeholder">{userName.charAt(0).toUpperCase()}</div>
              <div className="profile-info">
                <p className="profile-name">{userName}</p>
                <p className="profile-role">{userType === 'student' ? 'Student' : 'Teacher'}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="page-body">
          {children}
        </section>
      </main>

      <style>{`
        .dashboard-root {
          display: flex;
          height: 100vh;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          background: var(--sidebar-bg);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex-shrink: 0;
        }

        .sidebar-brand {
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent);
        }

        .brand-dot {
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          font-weight: 500;
          transition: var(--transition-fast);
        }

        .nav-item:hover {
          background: var(--surface);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--surface-high);
          color: var(--accent);
          border-left: 3px solid var(--accent);
        }

        .nav-label { font-size: 0.9375rem; }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          background: transparent;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          background: none;
          color: var(--text-muted);
          text-align: left;
        }

        .logout-btn:hover {
          color: var(--error);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: transparent;
          position: relative;
          z-index: 1;
          height: 100vh;
          overflow-y: auto;
        }

        .content-header {
          height: 80px;
          padding: 0 5rem 0 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: var(--header-bg);
          opacity: 0.95;
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .icon-btn {
          background: none;
          color: var(--text-secondary);
          position: relative;
        }

        .notification-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          border: 2px solid var(--bg);
        }

        .user-profile-brief {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 1.5rem;
          border-left: 1px solid var(--border);
        }

        .avatar-placeholder {
          width: 36px;
          height: 36px;
          background: var(--surface-high);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--accent);
        }

        .profile-name { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
        .profile-role { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }

        .page-body {
          padding: 2.5rem;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .sidebar { width: 80px; }
          .nav-label, .sidebar-brand span, .profile-info { display: none; }
          .sidebar-brand { padding: 1.5rem; justify-content: center; }
          .user-profile-brief { border: none; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
