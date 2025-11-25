import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpIcon } from './Tooltip';
import { AlertCircle, Type, Minus, Plus, Settings2, X } from 'lucide-react';

const MIN_TEXT_LENGTH = 1;
const MAX_TEXT_LENGTH = 5000;

const FONT_SIZES = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

const LINE_HEIGHTS = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
};

const FONT_FAMILIES = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
};

const TextInput = ({ text, setText, onValidationChange }) => {
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState(false);
    const [fontSize, setFontSize] = useState('medium');
    const [lineHeight, setLineHeight] = useState('relaxed');
    const [fontFamily, setFontFamily] = useState('sans');
    const [showReadingOptions, setShowReadingOptions] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState(192); // Default h-48
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const textareaRef = useRef(null);
    const maxLength = MAX_TEXT_LENGTH;
    const isNearLimit = text.length > maxLength * 0.9;

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Reset height to get accurate scrollHeight
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            // Set responsive min/max heights
            const minHeight = windowWidth < 640 ? 150 : 192; // sm: 150px, md+: 192px
            const maxHeight = windowWidth < 640 ? 300 : windowWidth < 1024 ? 400 : 500;
            const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            setTextareaHeight(newHeight);
            textarea.style.height = `${newHeight}px`;
        }
    }, [text, fontSize, lineHeight, windowWidth]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth;
            setWindowWidth(newWidth);
            const textarea = textareaRef.current;
            if (textarea) {
                const minHeight = newWidth < 640 ? 150 : 192;
                const maxHeight = newWidth < 640 ? 300 : newWidth < 1024 ? 400 : 500;
                if (textareaHeight < minHeight) {
                    setTextareaHeight(minHeight);
                    textarea.style.height = `${minHeight}px`;
                } else if (textareaHeight > maxHeight) {
                    setTextareaHeight(maxHeight);
                    textarea.style.height = `${maxHeight}px`;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [textareaHeight]);

    useEffect(() => {
        const validation = validateText(text);
        setError(validation.error);
        if (onValidationChange) {
            onValidationChange(validation.isValid);
        }
    }, [text, onValidationChange]);

    const validateText = (value) => {
        if (!value || value.trim().length === 0) {
            return { isValid: false, error: 'Text cannot be empty' };
        }
        if (value.length < MIN_TEXT_LENGTH) {
            return { isValid: false, error: `Text must be at least ${MIN_TEXT_LENGTH} character` };
        }
        if (value.length > MAX_TEXT_LENGTH) {
            return { isValid: false, error: `Text must be no more than ${MAX_TEXT_LENGTH} characters` };
        }
        return { isValid: true, error: null };
    };

    const handleChange = (e) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setText(value);
            if (!touched) setTouched(true);
        }
    };

    const handleBlur = () => {
        setTouched(true);
    };

    const showError = touched && error;

    const decreaseFontSize = () => {
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex > 0) {
            setFontSize(sizes[currentIndex - 1]);
        }
    };

    const increaseFontSize = () => {
        const sizes = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex < sizes.length - 1) {
            setFontSize(sizes[currentIndex + 1]);
        }
    };

    const fontSizeLabels = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        xlarge: 'Extra Large',
    };

    const lineHeightLabels = {
        tight: 'Tight',
        normal: 'Normal',
        relaxed: 'Relaxed',
        loose: 'Loose',
    };

    const fontFamilyLabels = {
        sans: 'Sans',
        serif: 'Serif',
        mono: 'Mono',
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label 
                    htmlFor="script-input"
                    className="block text-sm font-medium text-gray-400 ml-1"
                >
                    Script
                </label>
                <div className="flex items-center gap-2">
                    <motion.button
                        type="button"
                        onClick={() => setShowReadingOptions(!showReadingOptions)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800/70 rounded-lg border border-gray-700/50 hover:border-gray-600/70 transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Reading options"
                    >
                        <Settings2 size={14} />
                        <span className="hidden sm:inline">Reading</span>
                    </motion.button>
                    <HelpIcon 
                        content="Enter the text you want to convert to speech. Maximum 5000 characters."
                        position="top"
                    />
                </div>
            </div>

            {/* Reading Options Panel */}
            <AnimatePresence>
                {showReadingOptions && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mb-3 overflow-hidden"
                    >
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 sm:p-4 space-y-3 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Type size={16} />
                                    <span>Reading Options</span>
                                </div>
                                <button
                                    onClick={() => setShowReadingOptions(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="Close reading options"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Font Size Control */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400">Font Size</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={decreaseFontSize}
                                            disabled={fontSize === 'small'}
                                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-gray-900/50 hover:bg-gray-900/70 rounded border border-gray-700/50 transition-all"
                                            aria-label="Decrease font size"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="flex-1 text-center text-xs text-gray-300 px-2 py-1 bg-gray-900/30 rounded border border-gray-700/30">
                                            {fontSizeLabels[fontSize]}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={increaseFontSize}
                                            disabled={fontSize === 'xlarge'}
                                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed bg-gray-900/50 hover:bg-gray-900/70 rounded border border-gray-700/50 transition-all"
                                            aria-label="Increase font size"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Line Height Control */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400">Line Height</label>
                                    <select
                                        value={lineHeight}
                                        onChange={(e) => setLineHeight(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs text-gray-300 bg-gray-900/50 border border-gray-700/50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 transition-all"
                                    >
                                        {Object.entries(lineHeightLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Font Family Control */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400">Font Family</label>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value)}
                                        className="w-full px-2 py-1.5 text-xs text-gray-300 bg-gray-900/50 border border-gray-700/50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 transition-all"
                                    >
                                        {Object.entries(fontFamilyLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className="relative"
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
            >
                <textarea
                    ref={textareaRef}
                    id="script-input"
                    value={text}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`input-field resize-none font-light transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 custom-scrollbar ${
                        FONT_SIZES[fontSize]
                    } ${LINE_HEIGHTS[lineHeight]} ${FONT_FAMILIES[fontFamily]} ${
                        showError ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                    style={{
                        height: `${textareaHeight}px`,
                        minHeight: windowWidth < 640 ? '150px' : '192px',
                        maxHeight: windowWidth < 640 ? '300px' : windowWidth < 1024 ? '400px' : '500px',
                    }}
                    placeholder="Enter your script here..."
                    aria-label="Script input"
                    aria-describedby={`char-count ${showError ? 'script-error' : ''}`}
                    aria-invalid={showError}
                    aria-errormessage={showError ? 'script-error' : undefined}
                    maxLength={maxLength}
                />
                <AnimatePresence>
                    {showError && (
                        <motion.div 
                            className="absolute top-2 right-2 z-10"
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0, rotate: 180 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <AlertCircle className="text-red-400" size={18} aria-hidden="true" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                <div>
                    {showError && (
                        <motion.p 
                            id="script-error"
                            className="text-xs text-red-400 flex items-center gap-1"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            role="alert"
                            aria-live="polite"
                        >
                            <AlertCircle size={12} aria-hidden="true" />
                            <span>{error}</span>
                        </motion.p>
                    )}
                </div>
                <motion.div 
                    id="char-count"
                    className={`text-right text-xs transition-colors duration-200 ${
                        isNearLimit ? 'text-yellow-400' : text.length > MAX_TEXT_LENGTH ? 'text-red-400' : 'text-gray-500'
                    }`}
                    initial={false}
                    animate={{ 
                        scale: isNearLimit ? [1, 1.05, 1] : 1 
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {text.length} / {maxLength} characters
                </motion.div>
            </div>
        </div>
    );
};

export default TextInput;
