import React from 'react';
import { Mic, Gauge, Play, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { HelpIcon } from './Tooltip';

const Controls = ({ voices, selectedVoice, setSelectedVoice, speed, setSpeed, onGenerate, onCancel, isLoading, canGenerate = true }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Selection */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label 
                            htmlFor="voice-select"
                            className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1"
                        >
                            <Mic size={16} />
                            <span>Voice</span>
                        </label>
                        <HelpIcon 
                            content="Select the voice model for speech generation. Each voice has unique characteristics."
                            position="top"
                        />
                    </div>
                    <div className="relative">
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="input-field appearance-none cursor-pointer hover:border-blue-500/70 transition-all duration-200 focus:ring-2 focus:ring-blue-500/50"
                            aria-label="Voice selection"
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
                    <div className="flex items-center justify-between">
                        <label 
                            htmlFor="speed-slider"
                            className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1"
                        >
                            <Gauge size={16} />
                            <span>Speed: {speed.toFixed(1)}x</span>
                        </label>
                        <HelpIcon 
                            content="Adjust the speech speed. Range: 0.5x (slow) to 2.0x (fast)"
                            position="top"
                        />
                    </div>
                    <div className="h-[50px] flex items-center px-2">
                        <input
                            id="speed-slider"
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all duration-200"
                            aria-label="Speech speed"
                            aria-valuemin={0.5}
                            aria-valuemax={2.0}
                            aria-valuenow={speed}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>0.5x</span>
                        <span>1.0x</span>
                        <span>2.0x</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <motion.button
                    onClick={onCancel}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Cancel generation"
                >
                    <X size={18} />
                    <span>Cancel Generation</span>
                </motion.button>
            ) : (
                <motion.button
                    onClick={onGenerate}
                    disabled={!canGenerate}
                    className={`w-full btn-primary flex items-center justify-center gap-2 relative overflow-hidden group ${
                        !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={!canGenerate ? {} : { scale: 1.02 }}
                    whileTap={!canGenerate ? {} : { scale: 0.98 }}
                    aria-label="Generate content"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                        initial={false}
                    />
                    <Play size={18} className="fill-current" />
                    <span>Generate Content</span>
                </motion.button>
            )}
        </div>
    );
};

export default Controls;
