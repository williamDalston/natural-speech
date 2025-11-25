import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getCuratedWritings, getGenres, generateSpeech } from '../api';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/dateFormatter';
import AudioPlayer from './AudioPlayer';
import WritingDetailModal from './WritingDetailModal';

const CuratedWritings = ({ onSelectWriting }) => {
    const [writings, setWritings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [genres, setGenres] = useState([]);
    const [selectedWriting, setSelectedWriting] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        loadGenres();
    }, []);

    useEffect(() => {
        loadWritings();
    }, [selectedGenre]);

    const loadGenres = async () => {
        try {
            const response = await getGenres('curated');
            setGenres(response.genres || []);
        } catch (err) {
            showError(err.message || 'Failed to load genres. Please refresh the page and try again.');
        }
    };

    const loadWritings = async () => {
        try {
            setLoading(true);
            const response = await getCuratedWritings(0, 100, selectedGenre || null);
            setWritings(response.writings || []);
        } catch (err) {
            showError(err.message || 'Failed to load curated writings. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayAudio = async (writing, e) => {
        if (e) e.stopPropagation();

        if (audioUrl && selectedWriting?.id === writing.id) {
            return;
        }

        try {
            setGeneratingAudio(writing.id);
            setSelectedWriting(writing);

            if (audioUrl) URL.revokeObjectURL(audioUrl);

            const audioBlob = await generateSpeech(
                writing.content,
                'af_bella',
                1.0
            );

            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            success('Audio generated successfully');
        } catch (err) {
            showError(err.message || 'Failed to generate audio. Please try again.');
            setSelectedWriting(null);
        } finally {
            setGeneratingAudio(null);
        }
    };

    const handleSelect = (writing) => {
        setSelectedWriting(writing);
        setDetailModalOpen(true);
        if (onSelectWriting) {
            onSelectWriting(writing);
        }
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

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };


    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Amazing Writing Collection
                </h1>
                <p className="text-gray-400 text-base md:text-lg">
                    Explore curated masterpieces from literature, poetry, speeches, and essays
                </p>
            </div>

            {/* Genre Filter */}
            {genres.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        <motion.button
                            onClick={() => setSelectedGenre(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedGenre === null
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Show all genres"
                            aria-pressed={selectedGenre === null}
                        >
                            All Genres
                        </motion.button>
                        {genres.map((genre) => (
                            <motion.button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedGenre === genre
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={`Filter by ${genre}`}
                                aria-pressed={selectedGenre === genre}
                            >
                                {genre}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Audio Player for Selected Writing */}
            {selectedWriting && audioUrl && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 glass-card p-6 rounded-2xl border border-gray-800/50"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">
                                {selectedWriting.title || 'Untitled'}
                            </h3>
                            {selectedWriting.author && (
                                <p className="text-blue-400 mb-2">by {selectedWriting.author}</p>
                            )}
                            {selectedWriting.genre && (
                                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium mb-2">
                                    {selectedWriting.genre}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedWriting(null);
                                if (audioUrl) URL.revokeObjectURL(audioUrl);
                                setAudioUrl(null);
                            }}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
                            aria-label="Close audio player"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <AudioPlayer audioUrl={audioUrl} />
                </motion.div>
            )}

            {/* Writings Grid */}
            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : writings.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-lg font-medium mb-2">
                            {selectedGenre
                                ? `No writings found in "${selectedGenre}" genre`
                                : 'No curated writings found'
                            }
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                            {selectedGenre
                                ? 'Try selecting a different genre or view all genres.'
                                : 'Check back later for new curated content, or browse your own writings.'
                            }
                        </p>
                        {selectedGenre && (
                            <motion.button
                                onClick={() => setSelectedGenre(null)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white text-sm font-medium transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Show all genres"
                            >
                                View All Genres
                            </motion.button>
                        )}
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
                                    {/* Genre Badge */}
                                    {writing.genre && (
                                        <div className="absolute top-4 right-4">
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                                {writing.genre}
                                            </span>
                                        </div>
                                    )}

                                    {/* Play Button */}
                                    <div className="absolute bottom-4 right-4">
                                        <motion.button
                                            onClick={(e) => handlePlayAudio(writing, e)}
                                            disabled={generatingAudio === writing.id}
                                            className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            aria-label={`Play audio for ${writing.title || 'this writing'}`}
                                        >
                                            {generatingAudio === writing.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            ) : (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            )}
                                        </motion.button>
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
                }}
                writing={selectedWriting}
                onPlayAudio={handlePlayAudio}
                audioUrl={audioUrl}
                isGeneratingAudio={generatingAudio === selectedWriting?.id}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default CuratedWritings;

