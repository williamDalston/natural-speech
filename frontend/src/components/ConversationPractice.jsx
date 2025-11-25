import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Pause, Trash2, Download, Loader2, MessageSquare, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAutoSave } from '../hooks/useAutoSave';
import DraftRecovery from './DraftRecovery';
import logger from '../utils/logger';

const STORAGE_KEY = 'conversation_recordings';

// API function to get prompts
const getConversationPrompts = async (topic, count = 5) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const response = await fetch(`${API_BASE_URL}/conversation/prompts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, count }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate prompts');
    }
    
    return response.json();
};

const ConversationPractice = () => {
    const [topic, setTopic] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [currentRecording, setCurrentRecording] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDraftRecovery, setShowDraftRecovery] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const { success, error: showError } = useToast();

    // Auto-save hook
    const storageKey = 'conversation_practice_draft';
    const { isSaving, lastSaved, hasUnsavedChanges, clearDraft, recoverDraft } = useAutoSave(
        storageKey,
        { topic, prompts, currentPromptIndex },
        {
            interval: 30000,
            saveOnBlur: true,
            saveBeforeUnload: true,
        }
    );

    // Check for draft on mount
    useEffect(() => {
        const draft = recoverDraft();
        if (draft && (draft.topic || (draft.prompts && draft.prompts.length > 0))) {
            setShowDraftRecovery(true);
        }
    }, [recoverDraft]);

    // Load recordings from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setRecordings(parsed);
            }
        } catch (err) {
            logger.error('Failed to load recordings', err);
        }
    }, []);

    // Save recordings to local storage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
        } catch (err) {
            logger.error('Failed to save recordings', err);
        }
    }, [recordings]);

    const handleGeneratePrompts = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError(null);
        setPrompts([]);
        setCurrentPromptIndex(0);

        try {
            const data = await getConversationPrompts(topic.trim(), 5);
            setPrompts(data.prompts || []);
            if (data.prompts && data.prompts.length > 0) {
                success(`Generated ${data.prompts.length} practice prompts!`);
                // Clear draft after successful generation
                clearDraft();
            }
        } catch (err) {
            const errorMsg = err.message || 'Failed to generate prompts';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRecoverDraft = (draftData) => {
        if (draftData.topic) setTopic(draftData.topic);
        if (draftData.prompts && draftData.prompts.length > 0) {
            setPrompts(draftData.prompts);
            if (draftData.currentPromptIndex !== undefined) {
                setCurrentPromptIndex(draftData.currentPromptIndex);
            }
        }
        setShowDraftRecovery(false);
        success('Draft recovered');
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRecovery(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const newRecording = {
                    id: Date.now().toString(),
                    topic: topic || 'Untitled',
                    prompt: prompts[currentPromptIndex]?.question || 'No prompt',
                    audioUrl: audioUrl,
                    blob: audioBlob,
                    timestamp: new Date().toISOString(),
                    duration: 0, // Could calculate this if needed
                };

                setRecordings(prev => [newRecording, ...prev]);
                setCurrentRecording(newRecording);
                success('Recording saved!');
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            success('Recording started');
        } catch (err) {
            logger.error('Error starting recording', err);
            showError('Failed to start recording. Please check microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playRecording = (recording) => {
        if (audioRef.current) {
            if (currentRecording?.id === recording.id && isPlaying) {
                // Pause if playing the same recording
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                // Play new recording
                setCurrentRecording(recording);
                audioRef.current.src = recording.audioUrl;
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const deleteRecording = (recordingId) => {
        setRecordings(prev => {
            const updated = prev.filter(r => r.id !== recordingId);
            if (currentRecording?.id === recordingId) {
                setCurrentRecording(null);
                setIsPlaying(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                }
            }
            return updated;
        });
        success('Recording deleted');
    };

    const downloadRecording = (recording) => {
        const a = document.createElement('a');
        a.href = recording.audioUrl;
        a.download = `conversation-${recording.topic}-${recording.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const handleAudioPlay = () => {
        setIsPlaying(true);
    };

    const handleAudioPause = () => {
        setIsPlaying(false);
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

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-white mb-2">
                    Conversation Practice
                </h1>
                <p className="text-gray-400">
                    Practice speaking on any topic. Record yourself and listen back to improve.
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
                {/* Auto-save indicator */}
                <div className="flex items-center justify-end gap-2 text-sm mb-4">
                    {isSaving && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-blue-400"
                        >
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                        </motion.div>
                    )}
                    {!isSaving && lastSaved && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-gray-400"
                            title={`Last saved: ${lastSaved.toLocaleTimeString()}`}
                        >
                            <Clock size={14} />
                            <span className="text-xs">
                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </motion.div>
                    )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Enter a topic to practice
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
                            placeholder="e.g., climate change, artificial intelligence, travel..."
                            className="input-field w-full"
                            disabled={loading}
                        />
                    </div>
                    <motion.button
                        onClick={handleGeneratePrompts}
                        disabled={loading || !topic.trim()}
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
                                <MessageSquare size={18} />
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
                            initial={{ opacity: 0, x: 20, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 min-h-[100px]"
                        >
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-gray-300 text-lg leading-relaxed"
                            >
                                {currentPrompt?.question}
                            </motion.p>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-gray-500 text-sm mt-2"
                            >
                                {currentPrompt?.context}
                            </motion.p>
                        </motion.div>

                        {/* Recording Controls */}
                        <div className="mt-6 flex items-center justify-center gap-4">
                            {!isRecording ? (
                                <motion.button
                                    onClick={startRecording}
                                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-xl flex items-center gap-2 font-semibold transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Mic size={20} />
                                    <span>Start Recording</span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={stopRecording}
                                    className="px-6 py-3 bg-red-500/30 hover:bg-red-500/40 border border-red-500/70 text-red-200 rounded-xl flex items-center gap-2 font-semibold transition-all animate-pulse"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <MicOff size={20} />
                                    <span>Stop Recording</span>
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recordings List */}
            {recordings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Your Recordings ({recordings.length})
                    </h2>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {recordings.map((recording) => (
                            <motion.div
                                key={recording.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {recording.topic}
                                    </p>
                                    <p className="text-gray-400 text-sm truncate">
                                        {recording.prompt}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(recording.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        onClick={() => playRecording(recording)}
                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        {currentRecording?.id === recording.id && isPlaying ? (
                                            <Pause size={18} />
                                        ) : (
                                            <Play size={18} />
                                        )}
                                    </motion.button>
                                    <motion.button
                                        onClick={() => downloadRecording(recording)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Download size={18} />
                                    </motion.button>
                                    <motion.button
                                        onClick={() => deleteRecording(recording.id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Trash2 size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Hidden audio element for playback */}
            <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                className="hidden"
            />

            {/* Draft Recovery Modal */}
            {showDraftRecovery && (
                <DraftRecovery
                    storageKey={storageKey}
                    onRecover={handleRecoverDraft}
                    onDiscard={handleDiscardDraft}
                    onClose={() => setShowDraftRecovery(false)}
                    title="Recover Conversation Draft"
                />
            )}
        </div>
    );
};

export default ConversationPractice;

