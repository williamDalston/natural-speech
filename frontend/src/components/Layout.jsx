import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Menu, X } from 'lucide-react';
import { useState } from 'react';
import BackgroundDecorations from './BackgroundDecorations';

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'library', icon: BookOpen, label: 'Library' },
        { id: 'editor', icon: FileText, label: 'New Writing' },
    ];

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
                    {menuItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                                activeTab === item.id
                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            aria-current={activeTab === item.id ? 'page' : undefined}
                            aria-label={`Switch to ${item.label}`}
                        >
                            <motion.div
                                animate={activeTab === item.id ? { rotate: [0, -10, 10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                <item.icon size={20} aria-hidden="true" />
                            </motion.div>
                            <span className="font-medium">{item.label}</span>
                        </motion.button>
                    ))}
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

const Layout = ({ children, activeTab, setActiveTab }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                    className="h-14 sm:h-16 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 flex items-center justify-between md:justify-end shadow-lg shadow-black/20"
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

                    <motion.div 
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        {/* Add user profile or other header items here */}
                        <motion.div 
                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/30 border-2 border-white/10"
                            whileHover={{ scale: 1.15, rotate: 360 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </motion.div>
                </motion.header>

                {/* Skip to main content link - WCAG 2.4.1 */}
                <a href="#main-content" className="skip-link" aria-label="Skip to main content">
                    Skip to main content
                </a>

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
        </div>
    );
};

export default Layout;
