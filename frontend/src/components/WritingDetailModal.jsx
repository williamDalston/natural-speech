import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Edit2, Trash2, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';
import { highlightText } from '../utils/searchUtils';
import { useMobile } from '../hooks/useMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import AudioPlayer from './AudioPlayer';
import ExportModal from './ExportModal';

const WritingDetailModal = ({
    isOpen,
    onClose,
    writing,
    onEdit,
    onDelete,
    onPlayAudio,
    audioUrl,
    isGeneratingAudio,
    onDownload,
    onSwipeNext,
    onSwipePrevious,
    canSwipeNext = false,
    canSwipePrevious = false,
    searchQuery = null,
}) => {
    const { isMobile } = useMobile();
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previouslyFocusedElement = useRef(null);
    const [exportModalOpen, setExportModalOpen] = useState(false);

    // Touch gestures for swipe navigation
    const touchRef = useTouchGestures({
        onSwipeLeft: () => {
            if (canSwipeNext && onSwipeNext) {
                onSwipeNext();
            }
        },
        onSwipeRight: () => {
            if (canSwipePrevious && onSwipePrevious) {
                onSwipePrevious();
            }
        },
        swipeThreshold: 100,
    });

    // Store previously focused element and focus management
    useEffect(() => {
        if (isOpen) {
            // Store the element that had focus before opening the modal
            previouslyFocusedElement.current = document.activeElement;
            
            // Focus the close button initially
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        } else {
            // Restore focus to the previously focused element when modal closes
            if (previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
                previouslyFocusedElement.current = null;
            }
        }
    }, [isOpen]);

    // Keyboard support: Escape, Tab trapping
    useEffect(() => {
        if (!isOpen || !writing) return;

        const handleKeyDown = (e) => {
            // Close on Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
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
    }, [isOpen, writing, onClose]);

    if (!isOpen || !writing) return null;

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
                        {isOpen && `Writing detail view opened: ${writing.title || 'Untitled'}`}
                        {isGeneratingAudio && 'Generating audio...'}
                    </div>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="writing-detail-title"
                        aria-describedby="writing-detail-description"
                        onClick={(e) => {
                            // Close when clicking backdrop
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                    >
                        <motion.div
                            ref={(node) => {
                                modalRef.current = node;
                                if (touchRef && touchRef.current !== undefined) {
                                    touchRef.current = node;
                                }
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                            }}
                            className="glass-card p-6 max-w-3xl w-full my-8 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Swipe Navigation Indicators (Mobile) */}
                            {isMobile && (
                                <>
                                    {canSwipePrevious && (
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                            <ChevronLeft size={24} />
                                        </div>
                                    )}
                                    {canSwipeNext && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                            <ChevronRight size={24} />
                                        </div>
                                    )}
                                </>
                            )}
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1 pr-4">
                                    <h2
                                        id="writing-detail-title"
                                        className="text-2xl md:text-3xl font-bold text-white mb-2"
                                    >
                                        {searchQuery ? (
                                            <span dangerouslySetInnerHTML={{ 
                                                __html: highlightText(writing.title || 'Untitled', searchQuery) 
                                            }} />
                                        ) : (
                                            writing.title || 'Untitled'
                                        )}
                                    </h2>
                                    {writing.author && (
                                        <p className="text-blue-400 text-lg mb-2">
                                            by {searchQuery ? (
                                                <span dangerouslySetInnerHTML={{ 
                                                    __html: highlightText(writing.author, searchQuery) 
                                                }} />
                                            ) : (
                                                writing.author
                                            )}
                                        </p>
                                    )}
                                    {writing.genre && (
                                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium mb-2">
                                            {writing.genre}
                                        </span>
                                    )}
                                    <p 
                                        id="writing-detail-description"
                                        className="text-gray-400 text-sm"
                                    >
                                        {formatDate(writing.created_at)} • {writing.content.length} characters
                                    </p>
                                </div>
                                <button
                                    ref={closeButtonRef}
                                    onClick={onClose}
                                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    aria-label="Close writing details"
                                >
                                    <X size={24} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-800">
                                {onPlayAudio && (
                                    <motion.button
                                        onClick={() => onPlayAudio(writing)}
                                        disabled={isGeneratingAudio}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={`Play audio for ${writing.title || 'this writing'}`}
                                    >
                                        {isGeneratingAudio ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={18} aria-hidden="true" />
                                                Play Audio
                                            </>
                                        )}
                                    </motion.button>
                                )}
                                {onEdit && (
                                    <motion.button
                                        onClick={() => {
                                            onEdit(writing);
                                            onClose();
                                        }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={`Edit ${writing.title || 'this writing'}`}
                                    >
                                        <Edit2 size={18} aria-hidden="true" />
                                        Edit
                                    </motion.button>
                                )}
                                <motion.button
                                    onClick={() => setExportModalOpen(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={`Export and share ${writing.title || 'this writing'}`}
                                >
                                    <Share2 size={18} aria-hidden="true" />
                                    Export & Share
                                </motion.button>
                                {onDownload && (
                                    <motion.button
                                        onClick={() => onDownload(writing)}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={`Download ${writing.title || 'this writing'}`}
                                    >
                                        <Download size={18} aria-hidden="true" />
                                        Download
                                    </motion.button>
                                )}
                                {onDelete && (
                                    <motion.button
                                        onClick={() => onDelete(writing)}
                                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={`Delete ${writing.title || 'this writing'}`}
                                    >
                                        <Trash2 size={18} aria-hidden="true" />
                                        Delete
                                    </motion.button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="prose prose-invert max-w-none">
                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                                    {searchQuery ? (
                                        <span dangerouslySetInnerHTML={{ 
                                            __html: highlightText(writing.content, searchQuery) 
                                        }} />
                                    ) : (
                                        writing.content
                                    )}
                                </div>
                            </div>

                            {/* Audio Player */}
                            {audioUrl && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 pt-6 border-t border-gray-800"
                                >
                                    <h3 className="text-lg font-semibold text-white mb-3">Audio Preview</h3>
                                    <AudioPlayer audioUrl={audioUrl} />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    {/* Export Modal */}
                    <ExportModal
                        isOpen={exportModalOpen}
                        onClose={() => setExportModalOpen(false)}
                        writing={writing}
                    />
                </>
            )}
        </AnimatePresence>
    );
};

export default WritingDetailModal;

