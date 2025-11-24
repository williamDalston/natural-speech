import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpIcon } from './Tooltip';

const KeyboardShortcuts = () => {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts = [
        { key: 'Ctrl/Cmd + Enter', description: 'Generate content' },
        { key: '1', description: 'Switch to Text to Speech' },
        { key: '2', description: 'Switch to Avatar Studio' },
        { key: 'Esc', description: 'Close dialogs' },
        { key: 'Tab', description: 'Navigate between fields' },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 p-3 bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 z-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Show keyboard shortcuts"
                title="Keyboard Shortcuts"
            >
                <Keyboard size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed bottom-20 right-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-sm z-50"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Keyboard size={20} />
                                    Keyboard Shortcuts
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="Close shortcuts"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {shortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                                    >
                                        <span className="text-sm text-gray-400">{shortcut.description}</span>
                                        <kbd className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded border border-gray-700">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default KeyboardShortcuts;

