import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProgressIndicator = ({ progress, message, isIndeterminate = false }) => {
    const [announcement, setAnnouncement] = useState('');

    // Update announcement for screen readers when progress changes
    useEffect(() => {
        if (isIndeterminate) {
            setAnnouncement(message || 'Loading in progress');
        } else {
            const percent = Math.round(progress);
            setAnnouncement(
                message 
                    ? `${message}: ${percent}% complete`
                    : `Progress: ${percent}% complete`
            );
        }
    }, [progress, message, isIndeterminate]);

    if (isIndeterminate) {
        return (
            <>
                {/* ARIA Live Region for Screen Reader Announcements */}
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    {announcement}
                </div>
                <div 
                    className="flex items-center gap-3" 
                    role="progressbar" 
                    aria-label={message || "Loading"}
                    aria-busy="true"
                >
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    {message && (
                        <span className="text-sm text-gray-400">{message}</span>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            {/* ARIA Live Region for Screen Reader Announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>
            <div 
                className="w-full" 
                role="progressbar" 
                aria-valuenow={Math.round(progress)} 
                aria-valuemin={0} 
                aria-valuemax={100} 
                aria-label={message || "Progress"}
                aria-busy={progress < 100}
            >
                {message && (
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{message}</span>
                        <span className="text-sm text-gray-500" aria-label={`${Math.round(progress)} percent`}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                )}
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden" aria-hidden="true">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </>
    );
};

export default ProgressIndicator;
