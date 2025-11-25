import React from 'react';
import { Mic, Gauge, Play, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { HelpIcon } from './Tooltip';

const Controls = ({ voices, selectedVoice, setSelectedVoice, speed, setSpeed, onGenerate, onCancel, isLoading, canGenerate = true }) => {
    return (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {/* Voice Selection */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label 
                            htmlFor="voice-select"
                            className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1"
                        >
                            <Mic size={16} aria-hidden="true" />
                            <span>Voice</span>
                        </label>
                        <HelpIcon 
                            content="Select the voice model for speech generation. Each voice has unique characteristics."
                            position="top"
                        />
                    </div>
                    <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                    >
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
                        <motion.div 
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                            animate={{ y: [0, 2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label 
                            htmlFor="speed-slider"
                            className="flex items-center gap-2 text-sm font-medium text-gray-400 ml-1"
                        >
                            <Gauge size={16} aria-hidden="true" />
                            <span>Speed: {speed.toFixed(1)}x</span>
                        </label>
                        <HelpIcon 
                            content="Adjust the speech speed. Range: 0.5x (slow) to 2.0x (fast)"
                            position="top"
                        />
                    </div>
                    <motion.div 
                        className="h-[50px] flex items-center px-2"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="relative w-full">
                            <input
                                id="speed-slider"
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-2.5 bg-gray-700/60 rounded-lg appearance-none cursor-pointer transition-all duration-300 hover:h-3"
                                style={{
                                    background: `linear-gradient(to right, 
                                        rgb(59, 130, 246) 0%, 
                                        rgb(59, 130, 246) ${((speed - 0.5) / 1.5) * 100}%, 
                                        rgb(55, 65, 81) ${((speed - 0.5) / 1.5) * 100}%, 
                                        rgb(55, 65, 81) 100%)`
                                }}
                                aria-label="Speech speed"
                                aria-valuemin={0.5}
                                aria-valuemax={2.0}
                                aria-valuenow={speed}
                            />
                            <style>{`
                                #speed-slider::-webkit-slider-thumb {
                                    appearance: none;
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234));
                                    cursor: pointer;
                                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.15);
                                    transition: all 0.2s;
                                    border: 2px solid rgba(255, 255, 255, 0.2);
                                }
                                #speed-slider::-webkit-slider-thumb:hover {
                                    transform: scale(1.25);
                                    box-shadow: 0 3px 12px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(59, 130, 246, 0.2);
                                }
                                #speed-slider::-moz-range-thumb {
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    border: 2px solid rgba(255, 255, 255, 0.2);
                                    background: linear-gradient(135deg, rgb(59, 130, 246), rgb(147, 51, 234));
                                    cursor: pointer;
                                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
                                }
                                #speed-slider::-moz-range-thumb:hover {
                                    transform: scale(1.25);
                                }
                            `}</style>
                        </div>
                    </motion.div>
                    <div className="flex justify-between text-xs text-gray-500 px-1">
                        <motion.span 
                            className={speed === 0.5 ? 'text-blue-400 font-semibold' : ''}
                            animate={speed === 0.5 ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            0.5x
                        </motion.span>
                        <motion.span 
                            className={speed === 1.0 ? 'text-blue-400 font-semibold' : ''}
                            animate={speed === 1.0 ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            1.0x
                        </motion.span>
                        <motion.span 
                            className={speed === 2.0 ? 'text-blue-400 font-semibold' : ''}
                            animate={speed === 2.0 ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            2.0x
                        </motion.span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <motion.button
                    onClick={onCancel}
                    className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/50 hover:border-red-500/70 text-red-300 hover:text-red-200 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-red-500/10 text-sm sm:text-base min-h-[44px]"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Cancel generation"
                >
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                        <X size={18} />
                    </motion.div>
                    <span>Cancel Generation</span>
                </motion.button>
            ) : (
                <motion.button
                    onClick={onGenerate}
                    disabled={!canGenerate}
                    className={`w-full btn-primary flex items-center justify-center gap-2 sm:gap-2.5 relative overflow-hidden group text-sm sm:text-base min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 ${
                        !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={!canGenerate ? {} : { scale: 1.02, y: -1 }}
                    whileTap={!canGenerate ? {} : { scale: 0.98 }}
                    aria-label="Generate content"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-blue-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        initial={false}
                    />
                    <motion.div
                        animate={canGenerate ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <Play size={18} className="fill-current relative z-10" />
                    </motion.div>
                    <span className="relative z-10 font-semibold">Generate Content</span>
                    {canGenerate && (
                        <motion.div
                            className="absolute inset-0 bg-white/10"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        />
                    )}
                </motion.button>
            )}
        </div>
    );
};

export default Controls;
