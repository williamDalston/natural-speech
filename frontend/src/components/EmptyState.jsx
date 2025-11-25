import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable empty state component with illustrations and helpful guidance
 * @param {string} icon - Icon component to display
 * @param {string} title - Main heading
 * @param {string} description - Description text
 * @param {object} action - Optional action button {label, onClick}
 * @param {string} variant - Visual variant: 'default' | 'search' | 'error'
 */
const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    variant = 'default'
}) => {
    const variants = {
        default: {
            iconColor: 'text-gray-500',
            iconBg: 'bg-gray-800/50',
            titleColor: 'text-gray-400',
            descColor: 'text-gray-500'
        },
        search: {
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/10',
            titleColor: 'text-gray-300',
            descColor: 'text-gray-500'
        },
        error: {
            iconColor: 'text-red-400',
            iconBg: 'bg-red-500/10',
            titleColor: 'text-gray-300',
            descColor: 'text-gray-500'
        }
    };

    const colors = variants[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center justify-center p-8"
        >
            <div className="text-center max-w-md">
                {/* Icon */}
                <motion.div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full ${colors.iconBg} flex items-center justify-center`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200
                    }}
                >
                    {Icon && <Icon className={`w-8 h-8 ${colors.iconColor}`} aria-hidden="true" />}
                </motion.div>

                {/* Title */}
                <motion.h3
                    className={`text-lg font-semibold ${colors.titleColor} mb-2`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {title}
                </motion.h3>

                {/* Description */}
                <motion.p
                    className={`text-sm ${colors.descColor} mb-6 leading-relaxed`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {description}
                </motion.p>

                {/* Action Button */}
                {action && (
                    <motion.button
                        onClick={action.onClick}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={action.label}
                    >
                        {action.label}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default EmptyState;
