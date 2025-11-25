import React, { useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorDisplay = ({ 
    error, 
    onDismiss, 
    onRetry,
    type = 'error',
    showRetry = false,
    showDetails = false,
    errorDetails = null,
    isRetrying = false
}) => {
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    if (!error) return null;

    const config = {
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
            textColor: 'text-red-200',
            iconColor: 'text-red-400',
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20',
            textColor: 'text-yellow-200',
            iconColor: 'text-yellow-400',
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            textColor: 'text-blue-200',
            iconColor: 'text-blue-400',
        },
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20',
            textColor: 'text-green-200',
            iconColor: 'text-green-400',
        },
    };

    const style = config[type] || config.error;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`${style.bgColor} ${style.borderColor} border rounded-xl p-4 mb-6 pop-shadow`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <div className="flex items-start gap-3">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                        <Icon className={`${style.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <motion.p 
                            className={`${style.textColor} text-sm`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {error}
                        </motion.p>
                        
                        {/* Error Details Section */}
                        {(showDetails && errorDetails) && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                                    className={`${style.textColor} text-xs flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-current rounded px-2 py-1`}
                                    aria-expanded={showErrorDetails}
                                    aria-label={showErrorDetails ? "Hide error details" : "Show error details"}
                                >
                                    {showErrorDetails ? (
                                        <>
                                            <ChevronUp size={14} aria-hidden="true" />
                                            <span>Hide Details</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={14} aria-hidden="true" />
                                            <span>Show Details</span>
                                        </>
                                    )}
                                </button>
                                
                                <AnimatePresence>
                                    {showErrorDetails && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-2 overflow-hidden"
                                        >
                                            <div className="bg-black/20 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-auto max-h-48">
                                                <pre className="whitespace-pre-wrap break-words">
                                                    {typeof errorDetails === 'string' 
                                                        ? errorDetails 
                                                        : JSON.stringify(errorDetails, null, 2)}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                            {showRetry && onRetry && (
                                <motion.button
                                    onClick={onRetry}
                                    disabled={isRetrying}
                                    className={`${style.bgColor} ${style.borderColor} border rounded-lg px-3 py-1.5 text-xs font-medium ${style.textColor} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-current flex items-center gap-1.5`}
                                    whileHover={{ scale: isRetrying ? 1 : 1.02 }}
                                    whileTap={{ scale: isRetrying ? 1 : 0.98 }}
                                    aria-label="Retry operation"
                                >
                                    <RefreshCw 
                                        size={14} 
                                        className={isRetrying ? 'animate-spin' : ''} 
                                        aria-hidden="true"
                                    />
                                    <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                    {onDismiss && (
                        <motion.button
                            onClick={onDismiss}
                            className={`${style.textColor} hover:opacity-70 transition-opacity flex-shrink-0 p-1 rounded focus:outline-none focus:ring-2 focus:ring-current`}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Dismiss ${type} message`}
                            title={`Dismiss ${type} message`}
                        >
                            <X size={18} aria-hidden="true" />
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;

