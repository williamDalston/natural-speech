import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, X, RotateCcw, Trash2 } from 'lucide-react';
import logger from '../utils/logger';

/**
 * Component for recovering and managing drafts
 * @param {string} storageKey - The localStorage key to check for drafts
 * @param {function} onRecover - Callback when user chooses to recover a draft
 * @param {function} onDiscard - Callback when user chooses to discard a draft
 * @param {function} onClose - Callback to close the recovery modal
 * @param {string} title - Title for the draft recovery modal
 */
const DraftRecovery = ({ 
    storageKey, 
    onRecover, 
    onDiscard, 
    onClose,
    title = 'Recover Draft'
}) => {
    const [draft, setDraft] = useState(null);
    const [draftHistory, setDraftHistory] = useState([]);

    useEffect(() => {
        // Check for current draft
        try {
            const draftData = localStorage.getItem(storageKey);
            if (draftData) {
                const parsed = JSON.parse(draftData);
                const { _timestamp, _storageKey, ...data } = parsed;
                
                // Only show if there's actual content
                const hasContent = Object.values(data).some(
                    value => value !== null && value !== undefined && value !== ''
                );
                
                if (hasContent) {
                    setDraft({
                        data,
                        timestamp: _timestamp ? new Date(_timestamp) : new Date(),
                    });
                }
            }
        } catch (error) {
            logger.error('Failed to load draft', error);
        }

        // Load draft history (last 5 drafts)
        try {
            const historyKey = `${storageKey}_history`;
            const historyData = localStorage.getItem(historyKey);
            if (historyData) {
                const history = JSON.parse(historyData);
                setDraftHistory(history.slice(0, 5)); // Keep last 5
            }
        } catch (error) {
            logger.error('Failed to load draft history', error);
        }
    }, [storageKey]);

    const handleRecover = () => {
        if (draft && onRecover) {
            onRecover(draft.data);
        }
        handleClose();
    };

    const handleDiscard = () => {
        try {
            localStorage.removeItem(storageKey);
            setDraft(null);
        } catch (error) {
            logger.error('Failed to discard draft', error);
        }
        
        if (onDiscard) {
            onDiscard();
        }
        handleClose();
    };

    const handleRecoverFromHistory = (historyDraft) => {
        if (onRecover) {
            onRecover(historyDraft.data);
        }
        handleClose();
    };

    const handleDeleteHistory = (index) => {
        try {
            const historyKey = `${storageKey}_history`;
            const historyData = localStorage.getItem(historyKey);
            if (historyData) {
                const history = JSON.parse(historyData);
                history.splice(index, 1);
                localStorage.setItem(historyKey, JSON.stringify(history));
                setDraftHistory(history.slice(0, 5));
            }
        } catch (error) {
            logger.error('Failed to delete history item', error);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    if (!draft && draftHistory.length === 0) {
        return null;
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const getPreviewText = (data) => {
        // Try to get a preview from common fields
        if (data.content) return data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '');
        if (data.topic) return data.topic;
        if (data.title) return data.title;
        return 'Draft content';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card p-6 rounded-2xl border border-gray-800/50 max-w-md w-full max-h-[80vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText size={24} />
                            {title}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Current Draft */}
                    {draft && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <Clock size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-blue-400 font-medium mb-1">
                                        Unsaved draft from {formatTimestamp(draft.timestamp)}
                                    </p>
                                    <p className="text-xs text-gray-400 line-clamp-2">
                                        {getPreviewText(draft.data)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <motion.button
                                    onClick={handleRecover}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <RotateCcw size={16} />
                                    Recover Draft
                                </motion.button>
                                <motion.button
                                    onClick={handleDiscard}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Discard
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Draft History */}
                    {draftHistory.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">
                                Recent Drafts ({draftHistory.length})
                            </h3>
                            <div className="space-y-2">
                                {draftHistory.map((historyDraft, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-400 mb-1">
                                                    {formatTimestamp(historyDraft.timestamp)}
                                                </p>
                                                <p className="text-sm text-gray-300 line-clamp-2">
                                                    {getPreviewText(historyDraft.data)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleRecoverFromHistory(historyDraft)}
                                                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition-colors"
                                                    aria-label="Recover this draft"
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHistory(index)}
                                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                                                    aria-label="Delete this draft"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DraftRecovery;

