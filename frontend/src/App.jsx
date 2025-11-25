import React, { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { useApp } from './context/AppContext';
import { motion } from 'framer-motion';

// Lazy load components
const TextLibrary = lazy(() => import('./components/TextLibrary'));
const TextEditor = lazy(() => import('./components/TextEditor'));

// Loading fallback
const ComponentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

function App() {
    const { state, setActiveTab } = useApp();
    const [editingWriting, setEditingWriting] = useState(null);

    const handleNewWriting = () => {
        setEditingWriting(null);
        setActiveTab('editor');
    };

    const handleEditWriting = (writing) => {
        setEditingWriting(writing);
        setActiveTab('editor');
    };

    const handleSaveComplete = () => {
        setEditingWriting(null);
        setActiveTab('library');
    };

    const renderContent = () => {
        if (state.activeTab === 'editor') {
            return (
                <Suspense fallback={<ComponentLoader />}>
                    <TextEditor
                        writing={editingWriting}
                        onSave={handleSaveComplete}
                        onCancel={() => {
                            setEditingWriting(null);
                            setActiveTab('library');
                        }}
                    />
                </Suspense>
            );
        }

        // Default: Library view
        return (
            <div className="w-full h-full flex flex-col">
                {/* Purpose Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 glass-card p-6 md:p-8 rounded-2xl border border-gray-800/50 relative overflow-hidden"
                >
                    <motion.div
                        className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                                About Prose & Pause
                            </h2>
                            <p className="text-gray-300 leading-relaxed mb-3 text-base md:text-lg">
                                Prose & Pause is a writing platform designed to help you explore the beauty of written words through the power of audio. 
                                Write your thoughts, stories, and ideas, then experience them come to life with natural, expressive speech.
                            </p>
                            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                                Created by <span className="text-blue-400 font-semibold">Will Alston</span> to bridge the gap between writing and listening, 
                                making your words accessible and engaging through the art of voice.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 flex items-center justify-between flex-wrap gap-4"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Your Writing Library
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg">
                            Explore wonderful writing through beautiful audio
                        </p>
                    </div>
                    <motion.button
                        onClick={handleNewWriting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:via-blue-400 hover:to-purple-500 rounded-xl text-white font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 relative overflow-hidden group"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        />
                        <motion.svg 
                            className="w-5 h-5 relative z-10" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            animate={{ rotate: [0, 90, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </motion.svg>
                        <span className="relative z-10">New Writing</span>
                    </motion.button>
                </motion.div>

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

                <Suspense fallback={<ComponentLoader />}>
                    <TextLibrary
                        onSelectWriting={(writing) => {
                            // Could show a detail view or modal here
                            console.log('Selected writing:', writing);
                        }}
                        onEditWriting={handleEditWriting}
                    />
                </Suspense>
            </div>
        );
    };

    return (
        <Layout activeTab={state.activeTab} setActiveTab={setActiveTab}>
            <ToastContainer />
            {renderContent()}
        </Layout>
    );
}

export default App;
