import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
    variant?: 'floating' | 'header';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'floating' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle ${variant === 'header' ? 'theme-toggle-header' : ''}`}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} />
            ) : (
                <Moon size={20} />
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
                    color: var(--accent);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .theme-toggle:hover {
                    background: var(--surface-high);
                    transform: scale(1.1);
                    border-color: var(--accent);
                }

                .theme-toggle-header {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-sm);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    z-index: auto;
                }

                .theme-toggle-header:hover {
                    background: var(--surface-high);
                    border-color: transparent;
                    transform: none;
                    color: var(--accent);
                }
            `}</style>
        </button>
    );
};

export default ThemeToggle;
