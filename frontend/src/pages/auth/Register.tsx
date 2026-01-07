import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import Galaxy from '../../components/Galaxy/Galaxy';


const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [prn, setPrn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // Save to localStorage
    localStorage.setItem('user', JSON.stringify({
      name: fullName,
      role: 'student', // Defaulting to student for this demo registration
      email: email,
      prn: prn
    }));

    navigate('/student/dashboard');
  };

  return (
    <div className="auth-page">
      <Galaxy
        density={2.5}
        speed={0.3}
        hueShift={220}
        glowIntensity={0.5}
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
              <h2>Enrollment</h2>
              <p className="text-secondary">Register your academic profile.</p>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="neo-input"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>PRN Number</label>
                  <input
                    type="text"
                    className="neo-input"
                    placeholder="ID Number"
                    value={prn}
                    onChange={(e) => setPrn(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Institutional Email</label>
                <input
                  type="email"
                  className="neo-input"
                  placeholder="scholar@academy.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                Initialize Profile <UserPlus size={18} />
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have credentials? <Link to="/login">Sign In</Link></p>
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
          max-width: 520px;
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
          max-width: 520px;
          padding: 3rem;
          background: rgba(28, 28, 31, 0.95) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
        }

        .auth-header {
          margin-bottom: 2.5rem;
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

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .flex-1 { flex: 1; }

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
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .auth-card {
             padding: 2rem;
          }
           .auth-header h2 {
            font-size: 2rem;
          }
          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
