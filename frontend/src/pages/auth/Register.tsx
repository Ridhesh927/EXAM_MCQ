import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Galaxy from '../../components/Galaxy/Galaxy';


const Register = () => {
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
              <h2>Registration Disabled</h2>
              <p className="text-secondary">Contact your administrator for account creation.</p>
            </div>

            <div className="registration-notice">
              <div className="notice-icon">🔒</div>
              <h3>Public Registration Not Available</h3>
              <p>
                For security reasons, public registration has been disabled.
                Only authorized administrators can create new accounts.
              </p>
              <div className="notice-info">
                <h4>To get an account:</h4>
                <ul>
                  <li>Contact your teacher or system administrator</li>
                  <li>Provide your full name, email, and PRN number (for students)</li>
                  <li>Wait for your account to be created</li>
                  <li>You will receive your login credentials</li>
                </ul>
              </div>
            </div>

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

        .registration-notice {
          text-align: center;
          padding: 2rem;
        }

        .notice-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .registration-notice h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .registration-notice p {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .notice-info {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-sm);
          padding: 1.5rem;
          text-align: left;
          margin-top: 1.5rem;
        }

        .notice-info h4 {
          color: var(--accent);
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .notice-info ul {
          list-style: none;
          padding: 0;
        }

        .notice-info li {
          color: var(--text-muted);
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .notice-info li:before {
          content: "→";
          position: absolute;
          left: 0;
          color: var(--accent);
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
