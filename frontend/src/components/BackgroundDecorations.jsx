import React from 'react';
import writingBackground from '../assets/writing-background.svg';

const BackgroundDecorations = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <img 
                src={writingBackground} 
                alt="" 
                className="w-full h-full object-cover opacity-[0.35]"
                aria-hidden="true"
            />
            {/* Additional overlay for subtle effect with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/8 via-transparent to-purple-900/8" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/20 via-transparent to-transparent" />
        </div>
    );
};

export default BackgroundDecorations;

