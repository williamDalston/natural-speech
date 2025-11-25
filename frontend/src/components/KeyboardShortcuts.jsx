import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KeyboardShortcuts = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const closeButtonRef = useRef(null);
    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? externalOnClose : setInternalIsOpen;

    // Detect platform for key display
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? 'Cmd' : 'Ctrl';

    const shortcuts = {
        global: [
            { key: `${modifierKey} + K`, description: 'Open quick search' },
            { key: `${modifierKey} + N`, description: 'Create new writing' },
            { key: `${modifierKey} + S`, description: 'Save current writing' },
            { key: `${modifierKey} + /`, description: 'Show keyboard shortcuts' },
            { key: 'Esc', description: 'Close modals and dialogs' },
        ],
        navigation: [
            { key: '1', description: 'Create Writing' },
            { key: '2', description: 'My Writings' },
            { key: '3', description: 'Browse Amazing Writing' },
            { key: '4', description: 'Progress & Stats' },
            { key: '5', description: 'Speech Practice' },
            { key: '6', description: 'Conversation Practice' },
            { key: '7', description: 'Interactive Chat' },
            { key: '8', description: 'Rhetorical Devices' },
            { key: '9', description: 'Create Poem' },
        ],
        editor: [
            { key: `${modifierKey} + Enter`, description: 'Generate audio' },
            { key: 'Tab', description: 'Indent text (in editor)' },
            { key: 'Shift + Tab', description: 'Outdent text (in editor)' },
        ],
        writing: [
            { key: `${modifierKey} + ←`, description: 'Previous writing (in library)' },
            { key: `${modifierKey} + →`, description: 'Next writing (in library)' },
        ],
    };

    // Focus management
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Keyboard handling
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, setIsOpen]);

    const renderShortcutGroup = (title, groupShortcuts) => (
        <div className="mb-6 last:mb-0">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                {title}
            </h4>
            <div className="space-y-2">
                {groupShortcuts.map((shortcut, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                        <span className="text-sm text-gray-300">{shortcut.description}</span>
                        <kbd className="px-2.5 py-1 bg-gray-900 text-xs font-mono text-gray-200 rounded border border-gray-700 shadow-sm">
                            {shortcut.key}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {/* Floating button (only if not controlled externally) */}
            {!isControlled && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 p-3 bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 z-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Show keyboard shortcuts"
                    title="Keyboard Shortcuts (Ctrl/Cmd + /)"
                >
                    <Keyboard size={20} />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto z-50"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="shortcuts-title"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 
                                    id="shortcuts-title"
                                    className="text-xl font-semibold text-white flex items-center gap-2"
                                >
                                    <Keyboard size={24} />
                                    Keyboard Shortcuts
                                </h3>
                                <button
                                    ref={closeButtonRef}
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Close shortcuts"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                {renderShortcutGroup('Global Shortcuts', shortcuts.global)}
                                {renderShortcutGroup('Navigation', shortcuts.navigation)}
                                {renderShortcutGroup('Editor', shortcuts.editor)}
                                {renderShortcutGroup('Writing Navigation', shortcuts.writing)}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 text-center">
                                Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Esc</kbd> to close
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default KeyboardShortcuts;
