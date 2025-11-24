import React, { useRef, useEffect } from 'react';
import { Download, Volume2 } from 'lucide-react';

const AudioPlayer = ({ audioUrl }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play();
        }
    }, [audioUrl]);

    if (!audioUrl) return null;

    return (
        <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-400">
                    <Volume2 size={18} />
                    <h3 className="text-sm font-medium">Generated Audio</h3>
                </div>
                <a
                    href={audioUrl}
                    download="speech.wav"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Download Audio"
                >
                    <Download size={18} />
                </a>
            </div>

            <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full h-8"
            />
        </div>
    );
};

export default AudioPlayer;
