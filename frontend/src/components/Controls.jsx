import React from 'react';
import { Mic, Gauge } from 'lucide-react';

const Controls = ({ voices, selectedVoice, setSelectedVoice, speed, setSpeed, onGenerate, isLoading }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Selection */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1">
                        <Mic size={16} />
                        <span>Voice</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="input-field appearance-none cursor-pointer"
                        >
                            {voices.map((voice) => (
                                <option key={voice} value={voice}>
                                    {voice.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1">
                        <Gauge size={16} />
                        <span>Speed: {speed}x</span>
                    </label>
                    <div className="h-[50px] flex items-center px-2">
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <span>Generate Content</span>
                )}
            </button>
        </div>
    );
};

export default Controls;
