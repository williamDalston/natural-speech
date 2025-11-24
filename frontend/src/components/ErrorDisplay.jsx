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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${style.bgColor} ${style.borderColor} border rounded-xl p-4 mb-6 flex items-start gap-3`}
            >
                <Icon className={`${style.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                <div className="flex-1">
                    <p className={`${style.textColor} text-sm`}>{error}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={`${style.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
                    >
                        <X size={18} />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;

