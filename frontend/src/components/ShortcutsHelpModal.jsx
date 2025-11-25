import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command, Search, FileText, Save, HelpCircle, ArrowLeft, ArrowRight, Play, Tab } from 'lucide-react';

const ShortcutsHelpModal = ({ isOpen, onClose }) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKeySymbol = isMac ? '⌘' : 'Ctrl';
    const modKeyName = isMac ? 'Cmd' : 'Ctrl';

    const shortcuts = [
        {
            category: 'Global Shortcuts',
            items: [
                {
                    keys: [modKeySymbol, 'K'],
                    description: 'Quick search',
                    icon: Search,
                },
                {
                    keys: [modKeySymbol, 'N'],
                    description: 'New writing',
                    icon: FileText,
                },
                {
                    keys: [modKeySymbol, 'S'],
                    description: 'Save current writing',
                    icon: Save,
                },
                {
                    keys: [modKeySymbol, '/'],
                    description: 'Show/hide shortcuts help',
                    icon: HelpCircle,
                },
                {
                    keys: ['Esc'],
                    description: 'Close modals and dialogs',
                    icon: X,
                },
            ],
        },
        {
            category: 'Navigation',
            items: [
                {
                    keys: ['1'],
                    description: 'Create Writing',
                },
                {
                    keys: ['2'],
                    description: 'My Writings',
                },
                {
                    keys: ['3'],
                    description: 'Browse Amazing Writing',
                },
                {
                    keys: ['4'],
                    description: 'Progress & Stats',
                },
                {
                    keys: ['5'],
                    description: 'Speech Practice',
                },
                {
                    keys: ['6'],
                    description: 'Conversation Practice',
                },
                {
                    keys: ['7'],
                    description: 'Interactive Chat',
                },
                {
                    keys: ['8'],
                    description: 'Create Poem',
                },
            ],
        },
        {
            category: 'Editor Shortcuts',
            items: [
                {
                    keys: [modKeySymbol, 'Enter'],
                    description: 'Generate audio',
                    icon: Play,
                },
                {
                    keys: ['Tab'],
                    description: 'Indent text (in textarea)',
                    icon: Tab,
                },
            ],
        },
    ];

    const renderKey = (key) => {
        if (key === modKeySymbol) {
            return (
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-300">
                    {modKeyName}
                </kbd>
            );
        }
        
        // Special keys
        const specialKeys = {
            'Esc': 'Esc',
            'Enter': 'Enter',
            'Tab': 'Tab',
            '←': '←',
            '→': '→',
        };
        
        if (specialKeys[key]) {
            return (
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-300">
                    {specialKeys[key]}
                </kbd>
            );
        }
        
        // Regular keys
        return (
            <kbd className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-300 min-w-[28px] text-center">
                {key.toUpperCase()}
            </kbd>
        );
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-card p-6 rounded-2xl border border-gray-800/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="shortcuts-title"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Keyboard size={24} className="text-blue-400" />
                            </div>
                            <h2 id="shortcuts-title" className="text-2xl font-bold text-white">
                                Keyboard Shortcuts
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            aria-label="Close shortcuts help"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Shortcuts List */}
                    <div className="space-y-6">
                        {shortcuts.map((category, categoryIndex) => (
                            <motion.div
                                key={category.category}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: categoryIndex * 0.1 }}
                            >
                                <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                    {category.category}
                                </h3>
                                <div className="space-y-2">
                                    {category.items.map((item, itemIndex) => (
                                        <motion.div
                                            key={itemIndex}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: categoryIndex * 0.1 + itemIndex * 0.05 }}
                                            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {item.icon && (
                                                    <item.icon size={18} className="text-gray-400" />
                                                )}
                                                <span className="text-gray-300">{item.description}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {item.keys.map((key, keyIndex) => (
                                                    <React.Fragment key={keyIndex}>
                                                        {keyIndex > 0 && (
                                                            <span className="text-gray-500 text-xs mx-1">+</span>
                                                        )}
                                                        {renderKey(key)}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-800">
                        <p className="text-sm text-gray-400 text-center">
                            Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs">{modKeyName}</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs">/</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs">?</kbd> to toggle this help
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ShortcutsHelpModal;

