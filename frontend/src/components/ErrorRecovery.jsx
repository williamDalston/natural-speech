/**
 * ErrorRecovery Component
 * 
 * Provides error recovery UI with retry mechanisms
 * Shows user-friendly error messages with recovery options
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

const ErrorRecovery = ({
    error,
    onRetry,
    onDismiss,
    retryCount = 0,
    maxRetries = 3,
    showDetails = false,
    title = 'Something went wrong',
    retryLabel = 'Try Again',
    dismissLabel = 'Dismiss',
}) => {
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        if (retryCount >= maxRetries) {
            return;
        }

        setIsRetrying(true);
        try {
            await onRetry();
        } catch (err) {
            // Error will be handled by parent
        } finally {
            setIsRetrying(false);
        }
    };

    const canRetry = retryCount < maxRetries && !isRetrying;

    if (!error) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-red-400 font-semibold mb-1">{title}</h4>
                    <p className="text-gray-300 text-sm mb-3">
                        {typeof error === 'string' ? error : error.message || 'An unexpected error occurred'}
                    </p>

                    {showDetails && error && (
                        <button
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                            className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors"
                            aria-expanded={showErrorDetails}
                            aria-controls="error-details"
                        >
                            {showErrorDetails ? (
                                <>
                                    <ChevronUp size={14} aria-hidden="true" />
                                    Hide details
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={14} aria-hidden="true" />
                                    Show details
                                </>
                            )}
                        </button>
                    )}

                    <AnimatePresence>
                        {showErrorDetails && error && (
                            <motion.div
                                id="error-details"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-gray-900/50 rounded p-3 mb-3 overflow-hidden"
                            >
                                <pre className="text-xs text-red-300 whitespace-pre-wrap break-words">
                                    {typeof error === 'string' 
                                        ? error 
                                        : JSON.stringify(error, null, 2)}
                                </pre>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {canRetry && (
                            <motion.button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                aria-label={`${retryLabel} (Attempt ${retryCount + 1} of ${maxRetries})`}
                            >
                                {isRetrying ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                        <span>Retrying...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={14} aria-hidden="true" />
                                        <span>{retryLabel}</span>
                                        {retryCount > 0 && (
                                            <span className="text-xs opacity-75">({retryCount}/{maxRetries})</span>
                                        )}
                                    </>
                                )}
                            </motion.button>
                        )}

                        {!canRetry && retryCount >= maxRetries && (
                            <p className="text-xs text-gray-400">
                                Maximum retry attempts reached. Please try again later.
                            </p>
                        )}

                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm font-medium flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                aria-label={dismissLabel}
                            >
                                <X size={14} aria-hidden="true" />
                                <span>{dismissLabel}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ErrorRecovery;

