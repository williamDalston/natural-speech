import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import { getWritings, deleteWriting, generateSpeech, getGenres } from '../api';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { useMobile } from '../hooks/useMobile';
import { usePullToRefresh } from '../hooks/useTouchGestures';
import { useGlobalKeyboardShortcuts } from '../hooks/useGlobalKeyboardShortcuts';
import { formatDate } from '../utils/dateFormatter';
import { highlightText } from '../utils/searchUtils';
import { useApp } from '../context/AppContext';
import logger from '../utils/logger';
import { batchExport } from '../utils/exportUtils';
import AudioPlayer from './AudioPlayer';
import ConfirmationModal from './ConfirmationModal';
import WritingDetailModal from './WritingDetailModal';
import AdvancedSearch from './AdvancedSearch';

const TextLibrary = ({ onSelectWriting, onEditWriting }) => {
    const { state, setActiveTab } = useApp();
    const { isMobile } = useMobile();
    const [writings, setWritings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        author: '',
        genre: '',
        category: '',
        startDate: '',
        endDate: '',
        minWordCount: '',
        maxWordCount: ''
    });
    const [genres, setGenres] = useState([]);
    const debouncedSearch = useDebounce(searchQuery, 300);
    const debouncedFilters = useDebounce(filters, 300);
    const [selectedWriting, setSelectedWriting] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [writingToDelete, setWritingToDelete] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [selectedWritings, setSelectedWritings] = useState(new Set());
    const [batchExportModalOpen, setBatchExportModalOpen] = useState(false);
    const { success, error: showError } = useToast();

    // Keyboard navigation: Ctrl/Cmd + ←/→ for writing navigation
    useEffect(() => {
        if (state.activeTab !== 'library' || !selectedWriting || selectedIndex === -1) {
            return;
        }

        const handleKeyDown = (e) => {
            // Don't handle if typing in input
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            // Ctrl/Cmd + ←: Previous writing
            if (modifier && e.key === 'ArrowLeft' && selectedIndex > 0) {
                e.preventDefault();
                handleSwipeToPrevious();
            }

            // Ctrl/Cmd + →: Next writing
            if (modifier && e.key === 'ArrowRight' && selectedIndex < writings.length - 1) {
                e.preventDefault();
                handleSwipeToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedWriting, selectedIndex, writings.length, state.activeTab]);

    // Pull-to-refresh support
    const scrollContainerRef = usePullToRefresh(() => {
        loadWritings();
        success('Refreshed');
    });

    // Load genres on mount
    useEffect(() => {
        const loadGenres = async () => {
            try {
                const response = await getGenres();
                setGenres(response.genres || []);
            } catch (err) {
                // Silently fail - genres are optional
            }
        };
        loadGenres();
    }, []);

    useEffect(() => {
        loadWritings();
    }, [debouncedSearch, debouncedFilters]);

    // Arrow key navigation for writings
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in input/textarea
            const target = e.target;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            if (isInput) return;

            // Ctrl/Cmd + Arrow keys for navigation
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && writings.length > 0) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    // Navigate to previous writing
                    if (selectedIndex > 0) {
                        const prevWriting = writings[selectedIndex - 1];
                        handleSelect(prevWriting);
                    } else if (selectedIndex === -1 && writings.length > 0) {
                        // If nothing selected, select last one
                        handleSelect(writings[writings.length - 1]);
                    }
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    // Navigate to next writing
                    if (selectedIndex >= 0 && selectedIndex < writings.length - 1) {
                        const nextWriting = writings[selectedIndex + 1];
                        handleSelect(nextWriting);
                    } else if (selectedIndex === -1 && writings.length > 0) {
                        // If nothing selected, select first one
                        handleSelect(writings[0]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [writings, selectedIndex]);

    const loadWritings = async () => {
        try {
            setLoading(true);
            const response = await getWritings(
                0,
                100,
                debouncedSearch || null,
                debouncedFilters.category || null,
                debouncedFilters.genre || null,
                debouncedFilters.author || null,
                debouncedFilters.startDate || null,
                debouncedFilters.endDate || null,
                debouncedFilters.minWordCount || null,
                debouncedFilters.maxWordCount || null
            );
            setWritings(response.writings || []);
        } catch (err) {
            showError(err.message || 'Failed to load writings. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (writing, e) => {
        e.stopPropagation();
        setWritingToDelete(writing);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!writingToDelete) return;

        try {
            setDeletingId(writingToDelete.id);
            await deleteWriting(writingToDelete.id);
            success('Writing deleted successfully');
            loadWritings();
            if (selectedWriting?.id === writingToDelete.id) {
                setSelectedWriting(null);
                setAudioUrl(null);
                setDetailModalOpen(false);
            }
            setDeleteConfirmOpen(false);
            setWritingToDelete(null);
        } catch (err) {
            showError(err.message || 'Failed to delete writing. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const handlePlayAudio = async (writing, e) => {
        e.stopPropagation();
        if (audioUrl && selectedWriting?.id === writing.id) {
            // Already playing this one
            return;
        }

        try {
            setGeneratingAudio(writing.id);
            setSelectedWriting(writing);

            const audioBlob = await generateSpeech(
                writing.content,
                'af_bella', // Default voice, can be made configurable
                1.0 // Default speed
            );

            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            success('Audio generated successfully');
        } catch (err) {
            showError(err.message || 'Failed to generate audio');
            setSelectedWriting(null);
        } finally {
            setGeneratingAudio(null);
        }
    };

    const handleSelect = (writing) => {
        const index = writings.findIndex(w => w.id === writing.id);
        setSelectedWriting(writing);
        setSelectedIndex(index);
        setDetailModalOpen(true);
        if (onSelectWriting) {
            onSelectWriting(writing);
        }
    };

    const handleSwipeToNext = () => {
        if (selectedIndex < writings.length - 1) {
            const nextWriting = writings[selectedIndex + 1];
            setSelectedWriting(nextWriting);
            setSelectedIndex(selectedIndex + 1);
        }
    };

    const handleSwipeToPrevious = () => {
        if (selectedIndex > 0) {
            const prevWriting = writings[selectedIndex - 1];
            setSelectedWriting(prevWriting);
            setSelectedIndex(selectedIndex - 1);
        }
    };

    // Keyboard navigation for writings
    const handleNavigateWriting = (direction) => {
        if (direction === 'next') {
            handleSwipeToNext();
        } else if (direction === 'prev') {
            handleSwipeToPrevious();
        }
    };

    // Global keyboard shortcuts for this component
    useGlobalKeyboardShortcuts({
        onNavigateWriting: handleNavigateWriting,
        activeTab: state.activeTab,
        writingIndex: selectedIndex,
        totalWritings: writings.length,
        isInputFocused: false,
    });

    const handlePlayAudioFromModal = async (writing) => {
        if (audioUrl && selectedWriting?.id === writing.id) {
            return;
        }

        try {
            setGeneratingAudio(writing.id);
            setSelectedWriting(writing);

            const audioBlob = await generateSpeech(
                writing.content,
                'af_bella',
                1.0
            );

            if (audioUrl) URL.revokeObjectURL(audioUrl);
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            success('Audio generated successfully');
        } catch (err) {
            showError(err.message || 'Failed to generate audio. Please try again.');
        } finally {
            setGeneratingAudio(null);
        }
    };

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const renderHighlightedText = (text, query) => {
        if (!query || !text) return text;
        const highlighted = highlightText(text, query);
        return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    };

    const handleDownload = (writing) => {
        const blob = new Blob([writing.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${writing.title || 'writing'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        success('Writing downloaded successfully');
    };

    const handleToggleSelection = (writingId) => {
        setSelectedWritings(prev => {
            const next = new Set(prev);
            if (next.has(writingId)) {
                next.delete(writingId);
            } else {
                next.add(writingId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedWritings.size === writings.length) {
            setSelectedWritings(new Set());
        } else {
            setSelectedWritings(new Set(writings.map(w => w.id)));
        }
    };

    const handleBatchExport = (format) => {
        const selected = writings.filter(w => selectedWritings.has(w.id));
        if (selected.length === 0) {
            showError('Please select at least one writing to export');
            return;
        }
        try {
            batchExport(selected, format);
            success(`Exporting ${selected.length} writing(s) as ${format.toUpperCase()}`);
            setSelectedWritings(new Set());
            setBatchExportModalOpen(false);
        } catch (err) {
            showError(err.message || 'Failed to export writings');
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Advanced Search Component */}
            <AdvancedSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFiltersChange={setFilters}
                genres={genres}
                onSearch={loadWritings}
                showSuggestions={true}
            />

            {/* Batch Export Controls */}
            {writings.length > 0 && (
                <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSelectAll}
                            className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                            aria-label={selectedWritings.size === writings.length ? 'Deselect all' : 'Select all'}
                        >
                            {selectedWritings.size === writings.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedWritings.size > 0 && (
                            <span className="text-sm text-gray-400">
                                {selectedWritings.size} selected
                            </span>
                        )}
                    </div>
                    {selectedWritings.size > 0 && (
                        <motion.button
                            onClick={() => setBatchExportModalOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white transition-colors flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Download size={18} aria-hidden="true" />
                            Export Selected ({selectedWritings.size})
                        </motion.button>
                    )}
                </div>
            )}

            {/* Audio Player for Selected Writing */}
            {selectedWriting && audioUrl && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                >
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">
                            Now Playing
                        </h3>
                        <p className="text-white font-medium mb-3">
                            {selectedWriting.title || 'Untitled'}
                        </p>
                        <AudioPlayer audioUrl={audioUrl} />
                    </div>
                </motion.div>
            )}

            {/* Writings Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : writings.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg font-medium mb-2">No writings found</p>
                        <p className="text-gray-500 text-sm mb-4">
                            {debouncedSearch ? (
                                <>
                                    No results for "<span className="text-gray-400">{debouncedSearch}</span>".
                                    <br />Try a different search term or clear your search.
                                </>
                            ) : (
                                <>
                                    Your writing library is empty.
                                    <br />Create your first writing to get started!
                                </>
                            )}
                        </p>
                        {!debouncedSearch && (
                            <motion.button
                                onClick={() => setActiveTab('editor')}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white text-sm font-medium transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Create your first writing"
                            >
                                Create Your First Writing
                            </motion.button>
                        )}
                    </div>
                </div>
            ) : (
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                    <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                        <AnimatePresence>
                            {writings.map((writing) => (
                                <motion.div
                                    key={writing.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="glass-card p-5 cursor-pointer group relative"
                                    onClick={() => {
                                        if (selectedWritings.size > 0) {
                                            handleToggleSelection(writing.id);
                                        } else {
                                            handleSelect(writing);
                                        }
                                    }}
                                >
                                    {/* Selection Checkbox */}
                                    {selectedWritings.size > 0 && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedWritings.has(writing.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSelection(writing.id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                aria-label={`Select ${writing.title || 'this writing'}`}
                                            />
                                        </div>
                                    )}
                                    {/* Actions */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handlePlayAudio(writing, e)}
                                            disabled={generatingAudio === writing.id}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label={`Play audio for ${writing.title || 'this writing'}`}
                                            title="Play audio"
                                        >
                                            {generatingAudio === writing.id ? (
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            ) : (
                                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                </svg>
                                            )}
                                        </button>
                                        {onEditWriting && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditWriting(writing);
                                                }}
                                                className="p-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg transition-colors"
                                                aria-label={`Edit ${writing.title || 'this writing'}`}
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteClick(writing, e)}
                                            disabled={deletingId === writing.id}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label={`Delete ${writing.title || 'this writing'}`}
                                            title="Delete"
                                        >
                                            {deletingId === writing.id ? (
                                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            ) : (
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="pr-20">
                                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                            {debouncedSearch ? (
                                                <span dangerouslySetInnerHTML={{
                                                    __html: highlightText(writing.title || 'Untitled', debouncedSearch)
                                                }} />
                                            ) : (
                                                writing.title || 'Untitled'
                                            )}
                                        </h3>
                                        {writing.author && (
                                            <p className="text-sm text-blue-400 mb-2">
                                                by {debouncedSearch ? (
                                                    <span dangerouslySetInnerHTML={{
                                                        __html: highlightText(writing.author, debouncedSearch)
                                                    }} />
                                                ) : (
                                                    writing.author
                                                )}
                                            </p>
                                        )}
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                            {debouncedSearch ? (
                                                <span dangerouslySetInnerHTML={{
                                                    __html: highlightText(truncateText(writing.content), debouncedSearch)
                                                }} />
                                            ) : (
                                                truncateText(writing.content)
                                            )}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>{formatDate(writing.created_at)}</span>
                                            <span className="text-gray-500" aria-label={`${writing.content.length} characters`}>
                                                {writing.content.length} chars
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Writing Detail Modal */}
            <WritingDetailModal
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedWriting(null);
                    setSelectedIndex(-1);
                }}
                writing={selectedWriting}
                onEdit={onEditWriting}
                onDelete={(writing) => {
                    setDetailModalOpen(false);
                    setWritingToDelete(writing);
                    setDeleteConfirmOpen(true);
                }}
                onPlayAudio={handlePlayAudioFromModal}
                audioUrl={audioUrl}
                isGeneratingAudio={generatingAudio === selectedWriting?.id}
                onDownload={handleDownload}
                onSwipeNext={selectedIndex < writings.length - 1 ? handleSwipeToNext : null}
                onSwipePrevious={selectedIndex > 0 ? handleSwipeToPrevious : null}
                canSwipeNext={selectedIndex < writings.length - 1}
                canSwipePrevious={selectedIndex > 0}
                searchQuery={debouncedSearch}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    setDeleteConfirmOpen(false);
                    setWritingToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Writing"
                message={`Are you sure you want to delete "${writingToDelete?.title || 'this writing'}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={deletingId === writingToDelete?.id}
            />

            {/* Batch Export Modal */}
            {batchExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-6 max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Export Selected Writings</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Choose a format to export {selectedWritings.size} writing(s)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                onClick={() => handleBatchExport('txt')}
                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                TXT
                            </motion.button>
                            <motion.button
                                onClick={() => handleBatchExport('markdown')}
                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Markdown
                            </motion.button>
                            <motion.button
                                onClick={() => handleBatchExport('html')}
                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                HTML
                            </motion.button>
                            <motion.button
                                onClick={() => handleBatchExport('pdf')}
                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                PDF
                            </motion.button>
                        </div>
                        <button
                            onClick={() => setBatchExportModalOpen(false)}
                            className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default TextLibrary;

