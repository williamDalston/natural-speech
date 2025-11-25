import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * TypingText Component
 * Smoothly animates text appearance character by character for a professional typing effect
 */
const TypingText = ({ 
    text, 
    speed = 30, // milliseconds per character
    onComplete,
    className = '',
    showCursor = true 
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            setIsComplete(false);
            return;
        }

        setDisplayedText('');
        setIsComplete(false);
        let currentIndex = 0;

        const typeInterval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(typeInterval);
                setIsComplete(true);
                if (onComplete) {
                    onComplete();
                }
            }
        }, speed);

        return () => clearInterval(typeInterval);
    }, [text, speed, onComplete]);

    return (
        <span className={`typing-container ${className}`}>
            {displayedText}
            {showCursor && !isComplete && (
                <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
                    style={{ verticalAlign: 'middle' }}
                />
            )}
        </span>
    );
};

export default TypingText;

