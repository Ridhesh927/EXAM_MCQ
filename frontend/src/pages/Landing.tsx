import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight, ShieldCheck, Zap, Globe } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'student',
            title: 'Student',
            description: 'Participate in assessments, track proficiency, and manage your academic trajectory.',
            icon: <GraduationCap size={40} />,
            color: 'var(--accent)',
            path: '/login?role=student'
        },
        {
            id: 'teacher',
            title: 'Teacher',
            description: 'Engineer complex assessments, monitor scholar integrity, and analyze performance metrics.',
            icon: <ShieldCheck size={40} />,
            color: 'var(--success)',
            path: '/login?role=teacher'
        }
    ];

    return (
        <div className="landing-root">
            <header className="landing-header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="brand"
                >
                    <div className="brand-dot"></div>
                    <span>EXAM PORTAL</span>
                </motion.div>
            </header>

            <main className="landing-hero">
                <section className="hero-content">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        Precision In <br />
                        <span className="text-accent">Assessment.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="hero-subtitle"
                    >
                        An immersive environment for rigorous evaluation. Powered by AI, designed for integrity.
                    </motion.p>
                </section>

                <div className="role-selection">
                    {roles.map((role, i) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + (i * 0.2) }}
                            className="role-card-wrapper"
                            onClick={() => navigate(role.path)}
                        >
                            <div
                                className="role-card-border-anim"
                                style={{
                                    background: `conic-gradient(transparent, ${role.color}, transparent 30%)`
                                }}
                            ></div>
                            <div className="role-card neo-card">
                                <div className="role-icon" style={{ color: role.color }}>
                                    {role.icon}
                                </div>
                                <h3>{role.title}</h3>
                                <p>{role.description}</p>
                                <button className="role-btn">
                                    Login <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            <footer className="landing-footer">
                <div className="footer-stats">
                    <div className="stat">
                        <Zap size={16} className="text-accent" />
                        <span>Real-time Monitoring</span>
                    </div>
                    <div className="stat">
                        <Globe size={16} className="text-accent" />
                        <span>Global Accessibility</span>
                    </div>
                </div>
                <p className="copyright">© 2026 Academic Integrity Systems. All rights reserved.</p>
            </footer>

            <style>{`
                .landing-root {
                    height: 100vh;
                    background: var(--bg);
                    display: flex;
                    flex-direction: column;
                    padding: 0 4rem;
                    overflow: hidden;
                    position: relative;
                }

                .landing-root::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, var(--surface-low), transparent 70%);
                    opacity: 0.3;
                    pointer-events: none;
                }

                .landing-header {
                    height: 80px;
                    display: flex;
                    align-items: center;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    font-weight: 800;
                    letter-spacing: 0.2rem;
                    font-size: 1.1rem;
                }

                .brand-dot {
                    width: 10px;
                    height: 10px;
                    background: var(--accent);
                    border-radius: 50%;
                }

                .landing-hero {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    gap: 3rem;
                    padding-bottom: 2rem;
                }

                .hero-content h1 {
                    font-size: clamp(2.5rem, 6vw, 4.5rem);
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    font-family: var(--font-display);
                }

                .hero-subtitle {
                    font-size: 1.125rem;
                    color: var(--text-muted);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .role-selection {
                    display: flex;
                    gap: 2rem;
                    width: 100%;
                    max-width: 900px;
                    justify-content: center;
                }

                .role-card-wrapper {
                    position: relative;
                    padding: 2px;
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    cursor: pointer;
                    flex: 1;
                    max-width: 400px;
                    transition: transform 0.3s;
                }

                .role-card-wrapper:hover {
                    transform: translateY(-5px);
                }

                .role-card-border-anim {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    animation: rotate 4s linear infinite;
                    opacity: 0.6;
                    transition: opacity 0.3s;
                }

                .role-card-wrapper:hover .role-card-border-anim {
                    opacity: 1;
                }

                .role-card {
                    position: relative;
                    z-index: 1;
                    padding: 2.5rem;
                    background: var(--surface-low);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    border: none !important;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .role-icon {
                    margin-bottom: 0.5rem;
                }

                .role-card h3 {
                    font-size: 1.75rem;
                    font-family: var(--font-display);
                }

                .role-card p {
                    color: var(--text-muted);
                    line-height: 1.5;
                    font-size: 0.9375rem;
                }

                .role-btn {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 700;
                    background: none;
                    color: var(--accent);
                    padding: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 0.8125rem;
                }

                .landing-footer {
                    height: 80px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border);
                }

                .footer-stats {
                    display: flex;
                    gap: 2.5rem;
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8125rem;
                    color: var(--text-muted);
                }

                .copyright {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                @media (max-width: 768px) {
                    .landing-root { padding: 0 2rem; overflow-y: auto; height: auto; min-height: 100vh; }
                    .landing-hero { gap: 2rem; padding: 4rem 0; }
                    .role-selection { flex-direction: column; align-items: center; }
                    .role-card-wrapper { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
