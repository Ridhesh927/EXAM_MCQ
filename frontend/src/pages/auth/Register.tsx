import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="auth-page">
            <div className="auth-side-decor">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="auth-brand-content"
                >
                    <h1>Join the<br />Academy</h1>
                    <p>Begin your journey of academic excellence. Create your student credentials to access registered examinations.</p>
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
                        <h2>Enrollment</h2>
                        <p className="text-secondary">Register your academic profile.</p>
                    </div>

                    <form className="auth-form">
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Full Name</label>
                                <input type="text" className="neo-input" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group flex-1">
                                <label>PRN Number</label>
                                <input type="text" className="neo-input" placeholder="ID Number" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Institutional Email</label>
                            <input type="email" className="neo-input" placeholder="scholar@academy.edu" />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="neo-input"
                                    placeholder="••••••••"
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

            <style>{`
        .auth-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
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
        }

        .auth-brand-content p {
          max-width: 400px;
          font-size: 1.25rem;
          color: var(--text-secondary);
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
          max-width: 520px;
        }

        .auth-header {
          margin-bottom: 2.5rem;
        }

        .auth-header h2 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
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

        @media (max-width: 968px) {
          .auth-side-decor {
            display: none;
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
