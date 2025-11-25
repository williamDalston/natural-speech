import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWritings, deleteWriting, generateSpeech } from '../api';
import { useToast } from '../hooks/useToast';
import AudioPlayer from './AudioPlayer';

const TextLibrary = ({ onSelectWriting, onEditWriting }) => {
    const [writings, setWritings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWriting, setSelectedWriting] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        loadWritings();
    }, [searchQuery]);

    const loadWritings = async () => {
        try {
            setLoading(true);
            const response = await getWritings(0, 100, searchQuery || null);
            setWritings(response.writings || []);
        } catch (err) {
            showError(err.message || 'Failed to load writings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this writing?')) {
            return;
        }

        try {
            await deleteWriting(id);
            success('Writing deleted successfully');
            loadWritings();
            if (selectedWriting?.id === id) {
                setSelectedWriting(null);
                setAudioUrl(null);
            }
        } catch (err) {
            showError(err.message || 'Failed to delete writing');
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
        setSelectedWriting(writing);
        if (onSelectWriting) {
            onSelectWriting(writing);
        }
    };

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search writings by title, content, or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <svg
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

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
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg font-medium mb-2">No writings found</p>
                        <p className="text-gray-600 text-sm">
                            {searchQuery ? 'Try a different search term' : 'Start by adding a new writing'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {writings.map((writing) => (
                                <motion.div
                                    key={writing.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="glass-card p-5 cursor-pointer group relative"
                                    onClick={() => handleSelect(writing)}
                                >
                                    {/* Actions */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handlePlayAudio(writing, e)}
                                            disabled={generatingAudio === writing.id}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors disabled:opacity-50"
                                            title="Play audio"
                                        >
                                            {generatingAudio === writing.id ? (
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
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
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(writing.id, e)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="pr-20">
                                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                            {writing.title || 'Untitled'}
                                        </h3>
                                        {writing.author && (
                                            <p className="text-sm text-blue-400 mb-2">by {writing.author}</p>
                                        )}
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                            {truncateText(writing.content)}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>{formatDate(writing.created_at)}</span>
                                            <span className="text-gray-500">
                                                {writing.content.length} characters
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextLibrary;

