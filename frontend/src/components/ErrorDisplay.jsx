import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorDisplay = ({ error, onDismiss, type = 'error' }) => {
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
                className={`${style.bgColor} ${style.borderColor} border rounded-xl p-4 mb-6 flex items-start gap-3 pop-shadow`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                    <Icon className={`${style.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                </motion.div>
                <div className="flex-1">
                    <motion.p 
                        className={`${style.textColor} text-sm`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {error}
                    </motion.p>
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
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;

