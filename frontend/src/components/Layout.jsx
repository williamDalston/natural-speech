import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Menu, X, MessageCircle, Mic, Wand2, PenTool, Users, Sparkles, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import BackgroundDecorations from './BackgroundDecorations';
import { useSidebarNavigation } from '../hooks/useSidebarNavigation';
import { useNavigationShortcuts } from '../hooks/useNavigationShortcuts';
import KeyboardShortcuts from './KeyboardShortcuts';
import SkipLink from './SkipLink';

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
    // Reorganized by user journey: primary actions first, then content, then practice
    const menuItems = [
        { id: 'editor', icon: FileText, label: 'Create Writing', priority: 'primary' },
        { id: 'library', icon: BookOpen, label: 'My Writings', priority: 'content' },
        { id: 'curated', icon: Sparkles, label: 'Browse Amazing Writing', priority: 'content' },
        { id: 'progress', icon: BarChart3, label: 'Progress & Stats', priority: 'content' },
        { id: 'speech', icon: Mic, label: 'Speech Practice', priority: 'practice' },
        { id: 'practice', icon: MessageCircle, label: 'Conversation Practice', priority: 'practice' },
        { id: 'interactive', icon: Users, label: 'Interactive Chat', priority: 'practice' },
        { id: 'rhetorical', icon: Wand2, label: 'Rhetorical Devices', priority: 'practice' },
        { id: 'poems', icon: PenTool, label: 'Create Poem', priority: 'creative' },
    ];

    // Keyboard navigation: 1-9 to switch tabs
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in input/textarea
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            // Don't handle if modifier keys are pressed
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
                return;
            }

            // Map number keys to menu items
            const keyMap = {
                '1': 'editor',
                '2': 'library',
                '3': 'curated',
                '4': 'progress',
                '5': 'speech',
                '6': 'practice',
                '7': 'interactive',
                '8': 'rhetorical',
                '9': 'poems',
            };

            if (keyMap[e.key] && menuItems.find(item => item.id === keyMap[e.key])) {
                e.preventDefault();
                setActiveTab(keyMap[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTab]);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 left-0 h-full bg-gray-900/98 backdrop-blur-xl border-r border-gray-800 w-64 sm:w-72 z-50 md:translate-x-0`}
            >
                <motion.div
                    className="p-6 flex items-center justify-between"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.h1
                        className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        Prose & Pause
                    </motion.h1>
                    <motion.button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                        aria-label="Close sidebar"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X size={24} aria-hidden="true" />
                    </motion.button>
                </motion.div>

                <nav className="mt-8 px-4 space-y-2" aria-label="Main navigation">
                    {menuItems.map((item, index) => {
                        const isActive = activeTab === item.id;
                        const isPrimary = item.priority === 'primary';

                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base relative ${isActive
                                    ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 border-l-4 border-blue-500 shadow-lg shadow-blue-500/20'
                                    : isPrimary
                                        ? 'text-gray-300 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
                                    }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={`Switch to ${item.label}`}
                            >
                                <motion.div
                                    animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    <item.icon size={20} aria-hidden="true" className={isActive ? 'text-blue-400' : ''} />
                                </motion.div>
                                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        className="absolute right-2 w-2 h-2 rounded-full bg-blue-500"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Horizontal Divider */}
                <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                <motion.div
                    className="absolute bottom-0 left-0 w-full p-6 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                >
                    {/* Horizontal Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                    <motion.div
                        className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 pop-shadow-lg"
                        whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="text-xs text-gray-500 mb-2">System Status</p>
                        <div className="flex items-center gap-2">
                            <motion.div
                                className="w-2 h-2 rounded-full bg-green-500"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [1, 0.7, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <span className="text-sm text-gray-300">Online</span>
                        </div>
                    </motion.div>

                    {/* Author Credit */}
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-xs text-gray-500 mb-1">Created by</p>
                        <p className="text-sm font-medium text-gray-300 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Will Alston
                        </p>
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    );
};

const Layout = ({ children, activeTab, setActiveTab, shortcutsModalRef }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Enable number key navigation for sidebar (1-9)
    useSidebarNavigation(setActiveTab, true);

    // Navigation items for breadcrumb and shortcuts (same order as Sidebar)
    const menuItems = [
        { id: 'editor', label: 'Create Writing' },
        { id: 'library', label: 'My Writings' },
        { id: 'curated', label: 'Browse Amazing Writing' },
        { id: 'progress', label: 'Progress & Stats' },
        { id: 'speech', label: 'Speech Practice' },
        { id: 'practice', label: 'Conversation Practice' },
        { id: 'interactive', label: 'Interactive Chat' },
        { id: 'rhetorical', label: 'Rhetorical Devices' },
        { id: 'poems', label: 'Create Poem' },
    ];

    // Enable navigation shortcuts (1-9 keys)
    useNavigationShortcuts({
        setActiveTab,
        menuItems,
        enabled: true
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 relative" role="application" aria-label="Prose & Pause Application">
            <BackgroundDecorations />
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="md:ml-64 min-h-screen flex flex-col relative z-10 overflow-x-hidden">
                {/* Header */}
                <motion.header
                    className="h-14 sm:h-16 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 flex items-center justify-between shadow-lg shadow-black/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                        aria-label="Open sidebar"
                        aria-expanded={isSidebarOpen}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Menu size={24} aria-hidden="true" />
                    </motion.button>

                    {/* Breadcrumb Navigation */}
                    <motion.nav
                        className="hidden md:flex items-center gap-2 text-sm text-gray-400 flex-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        aria-label="Breadcrumb"
                    >
                        <span className="text-gray-500">Prose & Pause</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-300">
                            {menuItems.find(item => item.id === activeTab)?.label || 'Home'}
                        </span>
                    </motion.nav>

                    <motion.div
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {/* System Status Indicator */}
                        <motion.div
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-300">Online</span>
                        </motion.div>
                    </motion.div>
                </motion.header>

                {/* Skip to main content link - WCAG 2.4.1 */}
                <SkipLink targetId="main-content" label="Skip to main content" />

                {/* Main Content */}
                <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full" role="main">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <KeyboardShortcuts ref={shortcutsModalRef} />
        </div>
    );
};

export default Layout;
