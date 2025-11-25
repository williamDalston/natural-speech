/**
 * SkipLink Component
 * 
 * Provides a "skip to main content" link for keyboard navigation
 * Improves accessibility by allowing users to skip repetitive navigation
 */

import React from 'react';
import { motion } from 'framer-motion';

const SkipLink = ({ targetId = 'main-content', label = 'Skip to main content' }) => {
    const handleClick = (e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <motion.a
            href={`#${targetId}`}
            onClick={handleClick}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            initial={{ opacity: 0, y: -10 }}
            whileFocus={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {label}
        </motion.a>
    );
};

export default SkipLink;

