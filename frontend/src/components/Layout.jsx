import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'tts', icon: Mic, label: 'Text to Speech' },
        { id: 'avatar', icon: Video, label: 'Avatar Studio' },
        // { id: 'settings', icon: Settings, label: 'Settings' },
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
                className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 w-64 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Natural AI
                    </h1>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <p className="text-xs text-gray-500 mb-2">System Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-gray-300">Online</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

const Layout = ({ children, activeTab, setActiveTab }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="md:ml-64 min-h-screen flex flex-col">
                {/* Header */}
                <header className="h-16 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between md:justify-end">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Add user profile or other header items here */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
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
