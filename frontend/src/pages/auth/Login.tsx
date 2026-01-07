import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Galaxy from '../../components/Galaxy/Galaxy';


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

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!isStudent) {
      if (trimmedIdentifier === demoTeacher.email && trimmedPassword === demoTeacher.pass) {
        localStorage.setItem('user', JSON.stringify({
          name: 'Demo Teacher',
          role: 'teacher',
          email: demoTeacher.email
        }));
        navigate('/teacher/dashboard');
      } else {
        setError('Invalid teacher credentials. Use teacher@demo.com / Teacher@123');
      }
    } else {
      if (demoStudent.ids.includes(trimmedIdentifier) && trimmedPassword === demoStudent.pass) {
        localStorage.setItem('user', JSON.stringify({
          name: 'Demo Student',
          role: 'student',
          identifier: trimmedIdentifier
        }));
        navigate('/student/dashboard');
      } else {
        setError('Invalid student credentials. Use STU001 or student@demo.com / Student@123');
      }
    }
  };

  return (
    <div className="auth-page">
      <Galaxy
        density={2}
        speed={0.4}
        hueShift={isStudent ? 160 : 250}
        glowIntensity={0.6}
        mouseInteraction={true}
      />

      <div className="auth-form-container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="auth-title"
        >
          <h1>DES Pune University</h1>
          <p>Online Exam Portal</p>
        </motion.div>

        <div className="auth-card-wrapper">
          <div className="auth-card-border-anim"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="neo-card auth-card"
          >
            <div className="auth-header">
              <h2>Sign In</h2>
              <p style={{ color: '#a1a1aa' }}>Welcome back, {isStudent ? 'Student' : 'Teacher'}.</p>
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
      </div>

      <style>{`
        .auth-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: var(--bg);
          position: relative;
          overflow: hidden;
          align-items: center;
          justify-content: center;
        }

        .auth-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .glow-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s infinite alternate;
        }

        .glow-1 {
          width: 400px;
          height: 400px;
          background: var(--accent);
          top: -100px;
          left: -100px;
        }

        .glow-2 {
          width: 500px;
          height: 500px;
          background: var(--success);
          bottom: -150px;
          right: -100px;
          animation-delay: -5s;
        }

        .glow-3 {
          width: 300px;
          height: 300px;
          background: var(--accent);
          top: 40%;
          right: 20%;
          animation-delay: -10s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-20px, 60px) scale(0.9); }
        }

        .auth-form-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          width: 100%;
          gap: 2rem;
        }

        .auth-title {
          text-align: center;
          color: var(--text-primary);
        }

        .auth-title h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .auth-title p {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .auth-card-wrapper {
          position: relative;
          padding: 6px;
          border-radius: var(--radius-md);
          overflow: hidden;
          width: 100%;
          max-width: 480px;
        }

        .auth-card-border-anim {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(transparent, #f97316, transparent 40%);
          animation: rotate 4s linear infinite;
          opacity: 1;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          padding: 3rem;
          background: rgba(28, 28, 31, 0.95) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
        }


        .auth-header {
          text-align: center;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }

        .auth-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #f4f4f5 !important;
        }

        .neo-input::-ms-reveal,
        .neo-input::-ms-clear,
        .neo-input::-webkit-reveal,
        .neo-input::-webkit-clear {
          display: none;
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
          color: #a1a1aa !important;
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
          color: #71717a !important;
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

        @media (max-width: 768px) {
          .auth-card {
            padding: 2rem;
          }
          .auth-header h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
