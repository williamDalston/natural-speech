import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default', // 'default', 'danger', 'warning'
    isLoading = false
}) => {
    const modalRef = useRef(null);
    const confirmButtonRef = useRef(null);
    const cancelButtonRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previouslyFocusedElement = useRef(null);

    // Store previously focused element and focus management
    useEffect(() => {
        if (isOpen) {
            // Store the element that had focus before opening the modal
            previouslyFocusedElement.current = document.activeElement;
            
            // Focus the modal container initially (will be trapped inside)
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 100);
        } else {
            // Restore focus to the previously focused element when modal closes
            if (previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
                previouslyFocusedElement.current = null;
            }
        }
    }, [isOpen]);

    // Keyboard support: Enter, Escape, Tab trapping
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Close on Escape (unless loading)
            if (e.key === 'Escape' && !isLoading) {
                e.preventDefault();
                onClose();
                return;
            }

            // Confirm on Enter (when not in an input field)
            if (e.key === 'Enter' && !isLoading) {
                const target = e.target;
                // Only confirm if not in a text input/textarea
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    onConfirm();
                    return;
                }
            }

            // Focus trapping: Keep focus within modal
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, isLoading, onClose, onConfirm]);

    const variants = {
        default: {
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
            iconColor: 'text-blue-400',
            borderColor: 'border-blue-500/30'
        },
        danger: {
            confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
            iconColor: 'text-red-400',
            borderColor: 'border-red-500/30'
        },
        warning: {
            confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            iconColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/30'
        }
    };

    const currentVariant = variants[variant] || variants.default;

    const handleConfirm = () => {
        if (!isLoading) {
            onConfirm();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ARIA Live Region for Screen Reader Announcements */}
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {isOpen && `${title}. ${message}`}
                        {isLoading && 'Processing your request...'}
                    </div>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        aria-describedby="modal-description"
                        onClick={(e) => {
                            // Close when clicking backdrop
                            if (e.target === e.currentTarget) {
                                handleClose();
                            }
                        }}
                    >
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                            }}
                            className="glass-card p-6 max-w-md w-full border-2"
                            style={{ borderColor: currentVariant.borderColor }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`flex-shrink-0 ${currentVariant.iconColor}`}>
                                    <AlertTriangle size={24} aria-hidden="true" />
                                </div>
                                <div className="flex-1">
                                    <h3
                                        id="modal-title"
                                        className="text-xl font-bold text-white mb-2"
                                    >
                                        {title}
                                    </h3>
                                    <p
                                        id="modal-description"
                                        className="text-gray-300 text-sm leading-relaxed"
                                    >
                                        {message}
                                    </p>
                                </div>
                                <button
                                    ref={closeButtonRef}
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Close dialog"
                                >
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    ref={cancelButtonRef}
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label={cancelLabel}
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    ref={confirmButtonRef}
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`px-4 py-2 ${currentVariant.confirmButton} disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                                        variant === 'danger' ? 'focus:ring-red-500' : 
                                        variant === 'warning' ? 'focus:ring-yellow-500' : 
                                        'focus:ring-blue-500'
                                    }`}
                                    aria-label={confirmLabel}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;

