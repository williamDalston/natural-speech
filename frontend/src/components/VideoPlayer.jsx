import React, { useRef, useEffect, useState } from 'react';
import { Download, Video, Share2, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VideoPlayer = ({ videoUrl }) => {
    const videoRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };

            document.addEventListener('fullscreenchange', handleFullscreenChange);

            return () => {
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
            };
        }
    }, [videoUrl]);

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (!document.fullscreenElement) {
                videoRef.current.requestFullscreen().catch((err) => {
                    console.log('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    const handleShare = async () => {
        if (navigator.share && videoUrl) {
            try {
                await navigator.share({
                    title: 'Generated Avatar Video',
                    text: 'Check out this AI-generated talking avatar!',
                    url: videoUrl,
                });
            } catch (err) {
                // User cancelled or error occurred - try clipboard fallback
                if (err.name !== 'AbortError') {
                    try {
                        await navigator.clipboard.writeText(videoUrl);
                        // Could trigger a toast here if we had access to it
                    } catch (clipboardErr) {
                        console.error('Failed to copy to clipboard:', clipboardErr);
                    }
                }
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(videoUrl);
                // Could trigger a toast here if we had access to it
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        }
    };

    if (!videoUrl) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-400">
                    <Video size={18} />
                    <h3 className="text-sm font-medium">Generated Avatar</h3>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={handleShare}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        title="Share Video"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Share video"
                    >
                        <Share2 size={18} />
                    </motion.button>
                    <motion.button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        title="Fullscreen"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle fullscreen"
                    >
                        <Maximize2 size={18} />
                    </motion.button>
                    <a
                        href={videoUrl}
                        download="avatar.mp4"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                        title="Download Video"
                        aria-label="Download video"
                    >
                        <Download size={18} />
                    </a>
                </div>
            </div>

            <div className="relative rounded-lg overflow-hidden bg-black aspect-video group">
                <video
                    ref={videoRef}
                    controls
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    preload="metadata"
                    aria-label="Generated avatar video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </motion.div>
    );
};

export default VideoPlayer;
