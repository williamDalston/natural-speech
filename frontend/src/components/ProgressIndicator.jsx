import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ProgressIndicator = ({ progress, message = 'Processing...', estimatedTime = null }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-800"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        className="text-blue-500"
                        initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                        animate={{
                            strokeDashoffset: 2 * Math.PI * 45 * (1 - (progress || 0) / 100),
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-blue-500 animate-spin" size={32} />
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm font-medium text-white mb-1">{message}</p>
                {progress !== null && (
                    <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
                )}
                {estimatedTime && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>~{estimatedTime} remaining</span>
                    </div>
                )}
            </div>

            {progress !== null && (
                <div className="w-full max-w-xs">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressIndicator;

