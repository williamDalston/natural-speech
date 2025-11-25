import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, XCircle, RefreshCw, HelpCircle } from 'lucide-react';

/**
 * Consistent error message component with specific, actionable messages
 * @param {string} type - Error type: 'network' | 'api' | 'validation' | 'generic'
 * @param {string} message - Error message
 * @param {function} onRetry - Retry callback
 * @param {function} onHelp - Help/support callback
 * @param {string} details - Additional error details
 */
const ErrorMessage = ({
    type = 'generic',
    message,
    onRetry,
    onHelp,
    details
}) => {
    const errorConfig = {
        network: {
            icon: AlertCircle,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/30',
            defaultMessage: 'Connection Error',
            defaultDetails: 'Please check your internet connection and try again.'
        },
        api: {
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            defaultMessage: 'Server Error',
            defaultDetails: 'Something went wrong on our end. Please try again later.'
        },
        validation: {
            icon: AlertTriangle,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            defaultMessage: 'Validation Error',
            defaultDetails: 'Please check your input and try again.'
        },
        generic: {
            icon: AlertCircle,
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/10',
            borderColor: 'border-gray-500/30',
            defaultMessage: 'An Error Occurred',
            defaultDetails: 'Please try again.'
        }
    };

    const config = errorConfig[type] || errorConfig.generic;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor} mb-4`}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />

                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${config.color} mb-1`}>
                        {message || config.defaultMessage}
                    </h4>
                    <p className="text-sm text-gray-400 mb-2">
                        {details || config.defaultDetails}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                        {onRetry && (
                            <motion.button
                                onClick={onRetry}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Try again"
                            >
                                <RefreshCw size={12} aria-hidden="true" />
                                Try Again
                            </motion.button>
                        )}
                        {onHelp && (
                            <motion.button
                                onClick={onHelp}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Get help"
                            >
                                <HelpCircle size={12} aria-hidden="true" />
                                Get Help
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ErrorMessage;
