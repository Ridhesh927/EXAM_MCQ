import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'primary' | 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'primary'
}) => {
    const accentColor = type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : 'var(--accent)';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="modal-content confirm-modal"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '400px', textAlign: 'center' }}
                    >
                        <div className="confirm-icon-wrapper" style={{ background: `${accentColor}15`, color: accentColor }}>
                            <AlertCircle size={32} />
                        </div>
                        
                        <h2 style={{ fontSize: '1.5rem', margin: '1rem 0 0.5rem' }}>{title}</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '2rem' }}>{message}</p>
                        
                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', width: '100%', border: 'none', padding: 0 }}>
                            <button className="neo-btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                                {cancelText}
                            </button>
                            <button 
                                className="neo-btn-primary" 
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                style={{ 
                                    flex: 1, 
                                    background: type === 'primary' ? 'linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)' : accentColor,
                                    borderColor: type === 'primary' ? 'var(--accent)' : accentColor,
                                    color: 'white',
                                    boxShadow: type === 'primary' ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>

                    <style>{`
                        .modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.85);
                            backdrop-filter: blur(4px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                        }
                        .confirm-modal {
                            padding: 2.5rem 2rem;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .confirm-icon-wrapper {
                            width: 64px;
                            height: 64px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 0.5rem;
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
