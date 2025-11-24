import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpIcon } from './Tooltip';
import { AlertCircle } from 'lucide-react';

const MIN_TEXT_LENGTH = 1;
const MAX_TEXT_LENGTH = 5000;

const TextInput = ({ text, setText, onValidationChange }) => {
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState(false);
    const maxLength = MAX_TEXT_LENGTH;
    const isNearLimit = text.length > maxLength * 0.9;

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

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <label 
                    htmlFor="script-input"
                    className="block text-sm font-medium text-gray-400 ml-1"
                >
                    Script
                </label>
                <HelpIcon 
                    content="Enter the text you want to convert to speech. Maximum 5000 characters."
                    position="top"
                />
            </div>
            <div className="relative">
                <textarea
                    id="script-input"
                    value={text}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`input-field h-48 resize-none font-light leading-relaxed transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 ${
                        showError ? 'border-red-500/50 focus:border-red-500' : ''
                    }`}
                    placeholder="Enter your script here..."
                    aria-label="Script input"
                    aria-describedby="char-count"
                    aria-invalid={showError}
                    maxLength={maxLength}
                />
                {showError && (
                    <div className="absolute top-2 right-2">
                        <AlertCircle className="text-red-400" size={18} />
                    </div>
                )}
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div>
                    {showError && (
                        <motion.p 
                            className="text-xs text-red-400 flex items-center gap-1"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AlertCircle size={12} />
                            {error}
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
