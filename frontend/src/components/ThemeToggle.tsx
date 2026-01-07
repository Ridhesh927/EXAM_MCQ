import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} className="text-accent" />
            ) : (
                <Moon size={20} className="text-accent" />
            )}
            <style>{`
                .theme-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .theme-toggle:hover {
                    background: var(--surface-high);
                    transform: scale(1.1);
                    border-color: var(--accent);
                }
            `}</style>
        </button>
    );
};

export default ThemeToggle;
