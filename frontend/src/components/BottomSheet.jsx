import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';

/**
 * BottomSheet component for mobile-friendly modals
 * Slides up from bottom on mobile, centered modal on desktop
 */
const BottomSheet = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxHeight = '90vh',
    showCloseButton = true,
    className = '',
}) => {
    const { isMobile } = useMobile();
    const sheetRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !sheetRef.current) return;

        const focusableElements = sheetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        sheetRef.current.addEventListener('keydown', handleTab);
        firstElement?.focus();

        return () => {
            sheetRef.current?.removeEventListener('keydown', handleTab);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Mobile: bottom sheet animation
    // Desktop: centered modal animation
    const mobileVariants = {
        hidden: { y: '100%', opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        exit: { 
            y: '100%', 
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    const desktopVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: { 
            scale: 1, 
            opacity: 1,
            transition: { type: 'spring', damping: 25, stiffness: 300 }
        },
        exit: { 
            scale: 0.9, 
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        aria-hidden="true"
                    />

                    {/* Bottom Sheet / Modal */}
                    <motion.div
                        ref={sheetRef}
                        variants={isMobile ? mobileVariants : desktopVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`fixed z-50 bg-gray-900/98 backdrop-blur-xl border-t border-gray-800 ${
                            isMobile 
                                ? 'bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl' 
                                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl max-w-lg w-full mx-4'
                        } ${className}`}
                        style={{
                            maxHeight: isMobile ? maxHeight : '90vh',
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
                    >
                        {/* Handle bar (mobile only) */}
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
                            </div>
                        )}

                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                                {title && (
                                    <h2 
                                        id="bottom-sheet-title"
                                        className="text-xl font-semibold text-white"
                                    >
                                        {title}
                                    </h2>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="ml-auto p-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                                        aria-label="Close"
                                    >
                                        <X size={24} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - ${title || showCloseButton ? '80px' : '40px'})` }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;

