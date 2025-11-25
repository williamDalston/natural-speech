import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import logger from '../utils/logger';

const QuickSearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const { setActiveTab } = useApp();
    const { success } = useToast();

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Handle search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            try {
                // Import API dynamically to avoid circular dependencies
                const { getWritings } = await import('../api');
                const response = await getWritings(0, 10, query);
                setResults(response.writings || []);
            } catch (error) {
                logger.error('Search failed', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && results.length > 0) {
                // Open first result
                handleSelectResult(results[0]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, onClose]);

    const handleSelectResult = (writing) => {
        setActiveTab('editor');
        // Trigger edit writing - this will be handled by parent
        if (window.handleEditWriting) {
            window.handleEditWriting(writing);
        }
        onClose();
        success(`Opened: ${writing.title || 'Untitled'}`);
    };

    const handleGoToLibrary = () => {
        setActiveTab('library');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card p-6 max-w-2xl w-full"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Search className="text-gray-400" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search writings..."
                                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                                aria-label="Search writings"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            aria-label="Close search"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {query && (
                        <div className="mt-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {results.map((writing) => (
                                        <motion.button
                                            key={writing.id}
                                            onClick={() => handleSelectResult(writing)}
                                            className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="font-medium text-white mb-1">
                                                {writing.title || 'Untitled'}
                                            </div>
                                            {writing.author && (
                                                <div className="text-sm text-blue-400 mb-1">
                                                    by {writing.author}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-400 line-clamp-2">
                                                {writing.content.substring(0, 150)}...
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p>No results found for "{query}"</p>
                                    <button
                                        onClick={handleGoToLibrary}
                                        className="mt-4 text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Go to Library
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="mb-2">Start typing to search your writings</p>
                            <p className="text-sm">Press Enter to open first result</p>
                            <p className="text-sm">Press Esc to close</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuickSearchModal;
