import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getToken } from '../../utils/auth';

const Settings = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
        type: 'idle',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        setStatus({ type: 'loading', message: 'Updating password...' });

        try {
            const token = getToken('student');
            const response = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Password updated successfully!' });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to update password' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Connection error. Please try again.' });
        }
    };

    return (
        <DashboardLayout userType="student">
            <div className="settings-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="settings-header"
                >
                    <h1 className="page-title">Account Settings</h1>
                    <p className="page-subtitle">Manage your security preferences and account details.</p>
                </motion.div>

                <div className="settings-grid">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="settings-card neo-card"
                    >
                        <div className="card-header">
                            <KeyRound className="text-accent" size={24} />
                            <h2>Security</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="settings-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        className="neo-input"
                                        placeholder="Enter current password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                    >
                                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        className="neo-input"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="neo-input"
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {status.type !== 'idle' && (
                                <div className={`status-message ${status.type}`}>
                                    {status.type === 'error' ? <AlertCircle size={18} /> :
                                        status.type === 'success' ? <CheckCircle2 size={18} /> : null}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="neo-btn-primary"
                                disabled={status.type === 'loading'}
                            >
                                {status.type === 'loading' ? 'Updating...' : 'Update Password'}
                                <ShieldCheck size={18} />
                            </button>
                        </form>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="settings-info-card neo-card"
                    >
                        <h3>Password Requirements</h3>
                        <ul className="requirements-list">
                            <li>Minimum 6 characters long</li>
                            <li>Should include a mix of letters and numbers</li>
                            <li>Avoid using common words or your name</li>
                        </ul>
                        <div className="security-notice">
                            <p>Protecting your account is our priority. Ensure your password is unique and not shared with anyone.</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .settings-container {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .settings-header {
                    margin-bottom: 2.5rem;
                }

                .page-title {
                    font-size: 2.5rem;
                    font-family: var(--font-display);
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 2rem;
                }

                .settings-card {
                    padding: 2.5rem;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }

                .card-header h2 {
                    font-family: var(--font-display);
                    font-size: 1.5rem;
                }

                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
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
                    display: flex;
                    align-items: center;
                }

                .password-input-wrapper .neo-input {
                    padding-right: 3rem;
                    width: 100%;
                }

                .eye-toggle-btn {
                    position: absolute;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: var(--transition-fast);
                    padding: 0.25rem;
                    border-radius: 50%;
                }

                .eye-toggle-btn:hover {
                    color: var(--accent);
                    background: var(--surface);
                }

                .status-message {
                    padding: 1rem;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.9375rem;
                }

                .status-message.error {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .status-message.success {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }

                .neo-btn-primary {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: fit-content;
                    padding: 0.875rem 2rem;
                }

                .settings-info-card {
                    padding: 2rem;
                    background: var(--surface-low);
                    height: fit-content;
                }

                .settings-info-card h3 {
                    margin-bottom: 1.5rem;
                    font-size: 1.125rem;
                }

                .requirements-list {
                    list-style: none;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .requirements-list li {
                    color: var(--text-muted);
                    font-size: 0.9375rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .requirements-list li::before {
                    content: "•";
                    color: var(--accent);
                    font-weight: bold;
                }

                .security-notice {
                    padding: 1.25rem;
                    background: var(--surface);
                    border-radius: var(--radius-sm);
                    border-left: 4px solid var(--accent);
                }

                .security-notice p {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                }

                @media (max-width: 868px) {
                    .settings-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Settings;
