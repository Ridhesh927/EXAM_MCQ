import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'student';

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isStudent = role === 'student';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo Credentials Logic
    const demoTeacher = { email: 'teacher@demo.com', pass: 'Teacher@123' };
    const demoStudent = { ids: ['STU001', 'student@demo.com'], pass: 'Student@123' };

    const trimmedIdentifier = identifier.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!isStudent) {
      if (trimmedIdentifier === demoTeacher.email.toLowerCase() && trimmedPassword === demoTeacher.pass) {
        navigate('/teacher/dashboard');
      } else {
        setError('Invalid teacher credentials. Use teacher@demo.com / Teacher@123');
      }
    } else {
      const isDemoId = demoStudent.ids.some(id => id.toLowerCase() === trimmedIdentifier);
      if (isDemoId && trimmedPassword === demoStudent.pass) {
        navigate('/student/dashboard');
      } else {
        setError('Invalid student credentials. Use STU001 or student@demo.com / Student@123');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side-decor">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="auth-brand-content"
        >
          <h1>Exam<br />Portal</h1>
          <p>
            {isStudent
              ? "A sanctuary for scholarly pursuit. Access your assessments and track your intellectual growth."
              : "The command center for academic integrity. Engineer assessments and monitor progress."}
          </p>
        </motion.div>
      </div>

      <div className="auth-form-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="neo-card auth-card"
        >
          <div className="auth-header">
            <div className={`role-badge ${role}`}>{role}</div>
            <h2>Sign In</h2>
            <p className="text-secondary">Welcome back, {isStudent ? 'Student' : 'Teacher'}.</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="auth-error"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="form-group">
              <label>{isStudent ? 'Email or PRN' : 'Institutional Email'}</label>
              <input
                type="text"
                className="neo-input"
                placeholder={isStudent ? "e.g. STU001 or scholar@academy.edu" : "e.g. instructor@academy.edu"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="neo-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="neo-btn-primary auth-submit">
              Access Dashboard <LogIn size={18} />
            </button>
          </form>

          <div className="auth-footer">
            <p>Credentials incorrect? <Link to="/">Return to Role Selection</Link></p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .auth-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
        }

        .auth-side-decor {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          background: var(--surface-low);
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .auth-side-decor::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 70% 30%, var(--accent-soft), transparent 70%);
          opacity: 0.1;
        }

        .auth-brand-content h1 {
          font-size: clamp(3rem, 10vw, 6rem);
          margin-bottom: 2rem;
          color: var(--accent);
          font-family: var(--font-display);
          line-height: 1;
        }

        .auth-brand-content p {
          max-width: 400px;
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .auth-form-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-card {
          width: 100%;
          max-width: 480px;
          padding: 3rem;
        }

        .auth-header {
          margin-bottom: 2.5rem;
          position: relative;
        }

        .role-badge {
            position: absolute;
            top: -1rem;
            right: 0;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.625rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: var(--surface-high);
            border: 1px solid var(--border);
        }

        .role-badge.student { color: var(--accent); border-color: var(--accent); }
        .role-badge.teacher { color: var(--success); border-color: var(--success); }

        .auth-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .auth-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 0.75rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          color: var(--text-muted);
          border: none;
          cursor: pointer;
        }

        .password-toggle:hover {
          color: var(--accent);
        }

        .auth-submit {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .auth-footer a {
            color: var(--accent);
            font-weight: 600;
            text-decoration: none;
        }

        @media (max-width: 968px) {
          .auth-side-decor {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
