import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Loader2, RefreshCw, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import logger from '../utils/logger';

const STORAGE_KEY = 'rhetorical_device_practice';

// API functions
const getRhetoricalDevices = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const response = await fetch(`${API_BASE_URL}/rhetorical-devices/list`);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch rhetorical devices');
    }
    
    return response.json();
};

const generatePracticePrompts = async (topic, devices, count = 3) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const response = await fetch(`${API_BASE_URL}/rhetorical-devices/practice`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, devices, count }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate prompts');
    }
    
    return response.json();
};

const RhetoricalDevicePractice = () => {
    const [topic, setTopic] = useState('');
    const [availableDevices, setAvailableDevices] = useState({});
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [error, setError] = useState(null);
    const [practiceHistory, setPracticeHistory] = useState([]);
    
    const { success, error: showError } = useToast();

    // Load devices on mount
    useEffect(() => {
        const loadDevices = async () => {
            try {
                setLoadingDevices(true);
                const data = await getRhetoricalDevices();
                setAvailableDevices(data.devices || {});
            } catch (err) {
                logger.error('Failed to load devices', err);
                showError('Failed to load rhetorical devices');
            } finally {
                setLoadingDevices(false);
            }
        };
        
        loadDevices();
        
        // Load practice history from localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPracticeHistory(parsed);
            }
        } catch (err) {
            logger.error('Failed to load practice history', err);
        }
    }, []);

    // Save practice history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceHistory));
        } catch (err) {
            logger.error('Failed to save practice history', err);
        }
    }, [practiceHistory]);

    const toggleDevice = (deviceName) => {
        setSelectedDevices(prev => {
            if (prev.includes(deviceName)) {
                return prev.filter(d => d !== deviceName);
            } else if (prev.length < 10) {
                return [...prev, deviceName];
            } else {
                showError('You can select up to 10 devices at a time');
                return prev;
            }
        });
    };

    const handleGeneratePrompts = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        if (selectedDevices.length === 0) {
            setError('Please select at least one rhetorical device');
            return;
        }

        setLoading(true);
        setError(null);
        setPrompts([]);
        setCurrentPromptIndex(0);

        try {
            const data = await generatePracticePrompts(topic.trim(), selectedDevices, 3);
            setPrompts(data.prompts || []);
            if (data.prompts && data.prompts.length > 0) {
                success(`Generated ${data.prompts.length} practice prompts!`);
                
                // Save to history
                const historyEntry = {
                    id: Date.now().toString(),
                    topic: topic.trim(),
                    devices: selectedDevices,
                    prompts: data.prompts,
                    timestamp: new Date().toISOString(),
                };
                setPracticeHistory(prev => [historyEntry, ...prev].slice(0, 20)); // Keep last 20
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to generate prompts';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const nextPrompt = () => {
        if (prompts.length > 0) {
            setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
        }
    };

    const prevPrompt = () => {
        if (prompts.length > 0) {
            setCurrentPromptIndex((prev) => (prev - 1 + prompts.length) % prompts.length);
        }
    };

    const currentPrompt = prompts[currentPromptIndex];
    const deviceEntries = Object.entries(availableDevices);

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-white mb-2">
                    Rhetorical Device Practice
                </h1>
                <p className="text-gray-400">
                    Practice writing with rhetorical devices. Choose a topic and devices, then get prompts to practice.
                </p>
            </motion.div>

            {/* Horizontal Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

            {/* Topic Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                <div className="flex items-center gap-4 flex-wrap mb-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Enter a topic to practice writing about
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    handleGeneratePrompts();
                                }
                            }}
                            placeholder="e.g., climate change, artificial intelligence, love..."
                            className="input-field w-full"
                            disabled={loading}
                        />
                    </div>
                    <motion.button
                        onClick={handleGeneratePrompts}
                        disabled={loading || !topic.trim() || selectedDevices.length === 0}
                        className="btn-primary flex items-center gap-2 min-h-[44px] px-6"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <PenTool size={18} />
                                <span>Generate Prompts</span>
                            </>
                        )}
                    </motion.button>
                </div>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </motion.div>

            {/* Device Selection Section */}
            {loadingDevices ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-6 flex items-center justify-center"
                >
                    <Loader2 className="animate-spin text-blue-400" size={24} />
                    <span className="ml-3 text-gray-400">Loading rhetorical devices...</span>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">
                            Select Rhetorical Devices ({selectedDevices.length}/10)
                        </h2>
                        {selectedDevices.length > 0 && (
                            <motion.button
                                onClick={() => setSelectedDevices([])}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Clear All
                            </motion.button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {deviceEntries.map(([deviceName, description]) => (
                            <motion.button
                                key={deviceName}
                                onClick={() => toggleDevice(deviceName)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    selectedDevices.includes(deviceName)
                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                        : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600'
                                }`}
                                whileHover={{ scale: 1.01, x: 4 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {selectedDevices.includes(deviceName) ? (
                                                <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 border-2 border-gray-600 rounded flex-shrink-0" />
                                            )}
                                            <span className="font-medium">{deviceName}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 ml-6">{description}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Prompts Section */}
            <AnimatePresence>
                {prompts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">
                                Practice Prompt {currentPromptIndex + 1} of {prompts.length}
                            </h2>
                            <div className="flex gap-2">
                                <motion.button
                                    onClick={prevPrompt}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <RefreshCw size={18} className="rotate-180" />
                                </motion.button>
                                <motion.button
                                    onClick={nextPrompt}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <RefreshCw size={18} />
                                </motion.button>
                            </div>
                        </div>
                        <motion.div
                            key={currentPromptIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 mb-4"
                        >
                            <p className="text-gray-300 text-lg leading-relaxed mb-4">
                                {currentPrompt?.prompt}
                            </p>
                            {currentPrompt?.devices && currentPrompt.devices.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-400 mb-2">Devices to use:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currentPrompt.devices.map((device, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                                            >
                                                {device}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {currentPrompt?.examples && (
                                <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700/30">
                                    <p className="text-xs font-medium text-gray-400 mb-1">Example/Hint:</p>
                                    <p className="text-sm text-gray-300">{currentPrompt.examples}</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Practice History */}
            {practiceHistory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen size={20} />
                        Recent Practice Sessions ({practiceHistory.length})
                    </h2>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {practiceHistory.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">{entry.topic}</p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {entry.devices.slice(0, 5).map((device, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30"
                                                >
                                                    {device}
                                                </span>
                                            ))}
                                            {entry.devices.length > 5 && (
                                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                                    +{entry.devices.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={() => {
                                            setTopic(entry.topic);
                                            setSelectedDevices(entry.devices);
                                            setPrompts(entry.prompts);
                                            setCurrentPromptIndex(0);
                                        }}
                                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Load
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RhetoricalDevicePractice;

