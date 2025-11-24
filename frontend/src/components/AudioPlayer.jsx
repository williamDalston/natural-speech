import React, { useRef, useEffect, useState } from 'react';
import { Download, Volume2, Share2, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

const AudioPlayer = ({ audioUrl }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            const audio = audioRef.current;
            
            const updateTime = () => setCurrentTime(audio.currentTime);
            const updateDuration = () => setDuration(audio.duration);
            const handleEnded = () => setIsPlaying(false);
            const handlePlay = () => setIsPlaying(true);
            const handlePause = () => setIsPlaying(false);

            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('play', handlePlay);
            audio.addEventListener('pause', handlePause);

            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('play', handlePlay);
                audio.removeEventListener('pause', handlePause);
            };
        }
    }, [audioUrl]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = percent * duration;
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShare = async () => {
        if (navigator.share && audioUrl) {
            try {
                await navigator.share({
                    title: 'Generated Speech Audio',
                    text: 'Check out this AI-generated speech!',
                    url: audioUrl,
                });
            } catch (err) {
                // User cancelled or error occurred - try clipboard fallback
                if (err.name !== 'AbortError') {
                    try {
                        await navigator.clipboard.writeText(audioUrl);
                        // Could trigger a toast here if we had access to it
                    } catch (clipboardErr) {
                        console.error('Failed to copy to clipboard:', clipboardErr);
                    }
                }
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(audioUrl);
                // Could trigger a toast here if we had access to it
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        }
    };

    if (!audioUrl) return null;

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-400">
                    <Volume2 size={18} />
                    <h3 className="text-sm font-medium">Generated Audio</h3>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={handleShare}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        title="Share Audio"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Share audio"
                    >
                        <Share2 size={18} />
                    </motion.button>
                    <a
                        href={audioUrl}
                        download="speech.wav"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        title="Download Audio"
                        aria-label="Download audio"
                    >
                        <Download size={18} />
                    </a>
                </div>
            </div>

            {/* Custom Player Controls */}
            <div className="space-y-3">
                {/* Progress Bar */}
                <div
                    className="relative h-2 bg-gray-700 rounded-full cursor-pointer group"
                    onClick={handleSeek}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={currentTime}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            const change = e.key === 'ArrowLeft' ? -5 : 5;
                            if (audioRef.current) {
                                audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + change));
                            }
                        }
                    }}
                >
                    <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${progress}%` }}
                        initial={false}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${progress}% - 8px)` }}
                    />
                </div>

                {/* Time and Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.button
                            onClick={togglePlay}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause size={20} className="text-blue-400" />
                            ) : (
                                <Play size={20} className="text-blue-400 fill-current" />
                            )}
                        </motion.button>
                        <span className="text-xs text-gray-400 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 flex-1 max-w-[120px] ml-4">
                        <Volume2 size={14} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => {
                                const newVolume = parseFloat(e.target.value);
                                setVolume(newVolume);
                                if (audioRef.current) {
                                    audioRef.current.volume = newVolume;
                                }
                            }}
                            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            aria-label="Volume"
                        />
                    </div>
                </div>
            </div>

            {/* Hidden native audio element for actual playback */}
            <audio
                ref={audioRef}
                src={audioUrl}
                className="hidden"
            />
        </motion.div>
    );
};

export default AudioPlayer;
