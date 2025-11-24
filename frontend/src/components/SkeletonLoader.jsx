import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ className = '' }) => {
    return (
        <div className={`glass-card p-6 ${className}`}>
            <div className="space-y-4">
                <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
                <div className="h-32 bg-gray-800 rounded animate-pulse" />
            </div>
        </div>
    );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <motion.div
                    key={i}
                    className="h-4 bg-gray-800 rounded animate-pulse"
                    style={{ width: i === lines - 1 ? '60%' : '100%' }}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                    }}
                />
            ))}
        </div>
    );
};

export const SkeletonButton = ({ className = '' }) => {
    return (
        <div className={`h-12 bg-gray-800 rounded-xl animate-pulse ${className}`} />
    );
};

export const SkeletonPlayer = ({ className = '' }) => {
    return (
        <div className={`glass-card p-4 ${className}`}>
            <div className="space-y-3">
                <div className="h-4 bg-gray-800 rounded w-1/3 animate-pulse" />
                <div className="h-2 bg-gray-800 rounded-full animate-pulse" />
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-4 bg-gray-800 rounded flex-1 animate-pulse" />
                </div>
            </div>
        </div>
    );
};
