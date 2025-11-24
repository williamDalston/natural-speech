import React, { useRef, useEffect } from 'react';
import { Download, Video } from 'lucide-react';

const VideoPlayer = ({ videoUrl }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoUrl && videoRef.current) {
            videoRef.current.play();
        }
    }, [videoUrl]);

    if (!videoUrl) return null;

    return (
        <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-400">
                    <Video size={18} />
                    <h3 className="text-sm font-medium">Generated Avatar</h3>
                </div>
                <a
                    href={videoUrl}
                    download="avatar.mp4"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Download Video"
                >
                    <Download size={18} />
                </a>
            </div>

            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                    ref={videoRef}
                    controls
                    src={videoUrl}
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
};

export default VideoPlayer;
