import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ProgressIndicator = ({ progress, message = 'Processing...', estimatedTime = null }) => {
    const progressValue = progress || 0;
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-6">
            <div className="relative w-28 h-28 pop-shadow-lg bg-gray-900/30 rounded-full p-4 border border-gray-800/50">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-gray-800/50"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="url(#progressGradient)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{
                            strokeDashoffset: 2 * Math.PI * 42 * (1 - progressValue / 100),
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                            <stop offset="50%" stopColor="rgb(147, 51, 234)" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="text-blue-400" size={36} strokeWidth={2.5} />
                    </motion.div>
                </div>
                {/* Progress percentage in center */}
                {progress !== null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span 
                            className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                            key={Math.round(progressValue)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {Math.round(progressValue)}%
                        </motion.span>
                    </div>
                )}
            </div>

            <div className="text-center space-y-2">
                <motion.p 
                    className="text-base font-semibold text-white"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {message}
                </motion.p>
                {estimatedTime && (
                    <motion.div 
                        className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Clock size={14} className="text-blue-400" />
                        <span className="font-medium">~{estimatedTime} remaining</span>
                    </motion.div>
                )}
            </div>

            {progress !== null && (
                <div className="w-full max-w-xs space-y-2">
                    <div className="h-2.5 bg-gray-800/60 rounded-full overflow-hidden shadow-inner pop-shadow border border-gray-700/30">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressValue}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-white/30"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressIndicator;

