import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpIcon } from './Tooltip';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ImageUpload = ({ image, setImage, onValidationChange }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!image) {
            setPreviewUrl(null);
            setError(null);
        }
    }, [image]);

    const validateFile = (file) => {
        if (!file) {
            return { isValid: false, error: null };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return {
                isValid: false,
                error: `Invalid file type. Please use: ${ALLOWED_TYPES.map((t) => t.split('/')[1].toUpperCase()).join(', ')}`,
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
            return {
                isValid: false,
                error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB`,
            };
        }

        return { isValid: true, error: null };
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = validateFile(file);
            setError(validation.error);
            if (validation.isValid) {
                setImage(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                if (onValidationChange) {
                    onValidationChange(true);
                }
            } else {
                setImage(null);
                setPreviewUrl(null);
                if (onValidationChange) {
                    onValidationChange(false);
                }
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setImage(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onValidationChange) {
            onValidationChange(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const validation = validateFile(file);
            setError(validation.error);
            if (validation.isValid) {
                setImage(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                if (onValidationChange) {
                    onValidationChange(true);
                }
            } else {
                setImage(null);
                setPreviewUrl(null);
                if (onValidationChange) {
                    onValidationChange(false);
                }
            }
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <label 
                    htmlFor="image-upload"
                    className="block text-sm font-medium text-gray-400 ml-1"
                >
                    Avatar Image
                </label>
                <HelpIcon 
                    content={`Upload an image of a face for the avatar. Supported formats: ${ALLOWED_TYPES.map((t) => t.split('/')[1].toUpperCase()).join(', ')} (max ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB)`}
                    position="top"
                />
            </div>

            <motion.div
                onClick={() => !previewUrl && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full h-40 sm:h-48 rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden group ${
                    previewUrl
                        ? 'border-gray-700 bg-gray-900/80 pop-shadow'
                        : isDragging
                        ? 'border-blue-500 bg-blue-500/10 pop-shadow-lg'
                        : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/30 cursor-pointer pop-shadow hover:pop-shadow-lg'
                }`}
                animate={{
                    scale: isDragging ? 1.02 : 1,
                    borderColor: isDragging ? 'rgba(59, 130, 246, 1)' : undefined,
                }}
                whileHover={!previewUrl ? { scale: 1.01, borderColor: 'rgba(59, 130, 246, 0.5)' } : {}}
                transition={{ duration: 0.2 }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !previewUrl) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                aria-label="Upload avatar image"
            >
                <AnimatePresence>
                    {previewUrl ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full"
                        >
                            <img
                                src={previewUrl}
                                alt="Avatar Preview"
                                className="w-full h-full object-contain"
                                loading="lazy"
                                decoding="async"
                            />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                whileHover={{ opacity: 1 }}
                            >
                                <motion.button
                                    onClick={handleClear}
                                    className="p-3 bg-gradient-to-br from-red-500/90 to-red-600/90 text-white rounded-full hover:from-red-400 hover:to-red-500 transition-all duration-300 shadow-lg shadow-red-500/30 border border-red-400/30"
                                    whileHover={{ scale: 1.15, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label="Remove image"
                                >
                                    <X size={20} />
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3"
                        >
                            <motion.div
                                className="p-4 rounded-full bg-gray-800/50 group-hover:bg-gray-800 transition-colors"
                                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                                animate={isDragging ? { 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0]
                                } : {}}
                                transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                            >
                                <Upload size={24} />
                            </motion.div>
                            <motion.div 
                                className="text-center px-2"
                                animate={isDragging ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                            >
                                <p className="text-xs sm:text-sm font-medium text-gray-300">
                                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">JPG, PNG, WebP (max {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB)</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <input
                id="image-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
                aria-label="Avatar image upload"
            />

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 pop-shadow"
                        role="alert"
                    >
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUpload;
