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
            className="w-full bg-gray-900/60 p-3 sm:p-4 rounded-xl border border-gray-700/60 pop-shadow-lg backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400">
                    <Video size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <h3 className="text-xs sm:text-sm font-medium">Generated Avatar</h3>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <motion.button
                        onClick={handleShare}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center pop-shadow hover:pop-shadow-lg frame-border-hover"
                        title="Share Video"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Share video"
                    >
                        <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </motion.button>
                    <motion.button
                        onClick={toggleFullscreen}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center pop-shadow hover:pop-shadow-lg frame-border-hover"
                        title="Fullscreen"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle fullscreen"
                    >
                        <Maximize2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </motion.button>
                    <a
                        href={videoUrl}
                        download="avatar.mp4"
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center pop-shadow hover:pop-shadow-lg frame-border-hover"
                        title="Download Video"
                        aria-label="Download video"
                    >
                        <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </a>
                </div>
            </div>

            <motion.div 
                className="relative rounded-lg overflow-hidden bg-black aspect-video group pop-shadow-lg border border-gray-800/50"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
            >
                <video
                    ref={videoRef}
                    controls
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    preload="metadata"
                    aria-label="Generated avatar video"
                />
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    );
};

export default VideoPlayer;
