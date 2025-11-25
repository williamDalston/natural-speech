import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Pause, Trash2, Download, Loader2, PenTool, Save, X, Clock } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAutoSave } from '../hooks/useAutoSave';
import { getPoetryStyles, createPoem, getPoems, deletePoem } from '../api';
import DraftRecovery from './DraftRecovery';
import ConfirmationModal from './ConfirmationModal';
import logger from '../utils/logger';

const STORAGE_KEY = 'poem_recordings';

const PoemCreator = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [styles, setStyles] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [currentRecording, setCurrentRecording] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPoems, setSavedPoems] = useState([]);
    const [showSavedPoems, setShowSavedPoems] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, poemId: null });
    const [showDraftRecovery, setShowDraftRecovery] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const { success, error: showError } = useToast();

    // Auto-save hook
    const storageKey = 'poem_creator_draft';
    const { isSaving, lastSaved, hasUnsavedChanges, clearDraft, recoverDraft } = useAutoSave(
        storageKey,
        { title, content, selectedStyle: selectedStyle?.name || null },
        {
            interval: 30000,
            saveOnBlur: true,
            saveBeforeUnload: true,
        }
    );

    // Check for draft on mount
    useEffect(() => {
        const draft = recoverDraft();
        if (draft && (draft.title || draft.content)) {
            setShowDraftRecovery(true);
        }
    }, [recoverDraft]);

    // Load poetry styles on mount
    useEffect(() => {
        const loadStyles = async () => {
            try {
                const data = await getPoetryStyles();
                setStyles(data.styles || []);
            } catch (err) {
                logger.error('Failed to load poetry styles', err);
                showError('Failed to load poetry styles');
            }
        };
        loadStyles();
    }, []);

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

    // Load saved poems
    useEffect(() => {
        const loadPoems = async () => {
            try {
                const data = await getPoems();
                setSavedPoems(data.poems || []);
            } catch (err) {
                logger.error('Failed to load poems', err);
            }
        };
        if (showSavedPoems) {
            loadPoems();
        }
    }, [showSavedPoems]);

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
                
                // Convert blob to base64 for storage
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    
                    const newRecording = {
                        id: Date.now().toString(),
                        title: title || 'Untitled Poem',
                        content: content || '',
                        style: selectedStyle?.name || null,
                        audioUrl: audioUrl,
                        blob: audioBlob,
                        base64Audio: base64Audio,
                        timestamp: new Date().toISOString(),
                    };

                    setRecordings(prev => [newRecording, ...prev]);
                    setCurrentRecording(newRecording);
                    success('Recording saved!');
                };
                reader.readAsDataURL(audioBlob);
                
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
        const filename = recording.title 
            ? `poem-${recording.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${recording.id}.webm`
            : `poem-${recording.id}.webm`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSavePoem = async () => {
        if (!content.trim()) {
            showError('Please write a poem first');
            return;
        }

        try {
            setSaving(true);
            const poemData = {
                title: title || null,
                content: content.trim(),
                style: selectedStyle?.name || null,
                audio_url: currentRecording?.base64Audio || null
            };

            await createPoem(poemData);
            success('Poem saved successfully!');
            
            // Clear draft after successful save
            clearDraft();
            
            // Clear form
            setTitle('');
            setContent('');
            setSelectedStyle(null);
            setCurrentRecording(null);
            
            // Reload saved poems if showing
            if (showSavedPoems) {
                const data = await getPoems();
                setSavedPoems(data.poems || []);
            }
        } catch (err) {
            showError(err.message || 'Failed to save poem');
        } finally {
            setSaving(false);
        }
    };

    const handleRecoverDraft = (draftData) => {
        if (draftData.title) setTitle(draftData.title);
        if (draftData.content) setContent(draftData.content);
        if (draftData.selectedStyle) {
            const style = styles.find(s => s.name === draftData.selectedStyle);
            if (style) setSelectedStyle(style);
        }
        setShowDraftRecovery(false);
        success('Draft recovered');
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRecovery(false);
    };

    const handleRecoverDraft = (draftData) => {
        if (draftData.title) setTitle(draftData.title);
        if (draftData.content) setContent(draftData.content);
        if (draftData.selectedStyle) {
            const style = styles.find(s => s.name === draftData.selectedStyle);
            if (style) setSelectedStyle(style);
        }
        setShowDraftRecovery(false);
        success('Draft recovered');
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRecovery(false);
    };

    const handleDeletePoem = (poemId) => {
        setDeleteConfirmModal({ isOpen: true, poemId });
    };

    const confirmDeletePoem = async () => {
        const { poemId } = deleteConfirmModal;
        if (!poemId) return;

        try {
            await deletePoem(poemId);
            success('Poem deleted successfully');
            const data = await getPoems();
            setSavedPoems(data.poems || []);
        } catch (err) {
            showError(err.message || 'Failed to delete poem');
        } finally {
            setDeleteConfirmModal({ isOpen: false, poemId: null });
        }
    };

    const handleStyleSelect = (style) => {
        setSelectedStyle(style);
        success(`Selected ${style.name} style`);
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

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Create a Poem
                        </h1>
                        <p className="text-gray-400">
                            Write your poem, choose a style, and record it. Save it or download the recording.
                        </p>
                    </div>
                    <motion.button
                        onClick={() => setShowSavedPoems(!showSavedPoems)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {showSavedPoems ? <X size={18} /> : <PenTool size={18} />}
                        <span>{showSavedPoems ? 'Hide' : 'View'} Saved Poems</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Horizontal Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

            {/* Saved Poems List */}
            <AnimatePresence>
                {showSavedPoems && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Your Saved Poems ({savedPoems.length})
                        </h2>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {savedPoems.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No saved poems yet. Create one above!</p>
                            ) : (
                                savedPoems.map((poem) => (
                                    <motion.div
                                        key={poem.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-medium mb-1">
                                                    {poem.title || 'Untitled Poem'}
                                                </h3>
                                                {poem.style && (
                                                    <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded mb-2">
                                                        {poem.style}
                                                    </span>
                                                )}
                                                <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                                                    {poem.content}
                                                </p>
                                                <p className="text-gray-500 text-xs mt-2">
                                                    {new Date(poem.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <motion.button
                                                onClick={() => handleDeletePoem(poem.id)}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poetry Styles Section */}
            {styles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Choose a Poetry Style
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {styles.map((style) => (
                            <motion.button
                                key={style.name}
                                onClick={() => handleStyleSelect(style)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                    selectedStyle?.name === style.name
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <h3 className="text-white font-semibold mb-1">{style.name}</h3>
                                <p className="text-gray-400 text-xs line-clamp-2">
                                    {style.description}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Poem Editor Section */}
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
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Title (Optional)
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your poem a title..."
                        className="input-field w-full"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Your Poem
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your poem here... Let your creativity flow!"
                        className="input-field w-full min-h-[200px] font-serif text-lg leading-relaxed"
                        rows={10}
                    />
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{wordCount} words</span>
                        <span>{charCount} characters</span>
                    </div>
                </div>

                {selectedStyle && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-400">
                            <span className="font-semibold">Style:</span> {selectedStyle.name}
                        </p>
                        {selectedStyle.example && (
                            <p className="text-xs text-gray-400 mt-2 italic">
                                Example: {selectedStyle.example.split('\n')[0]}...
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                    <motion.button
                        onClick={handleSavePoem}
                        disabled={saving || !content.trim()}
                        className="btn-primary flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Poem</span>
                            </>
                        )}
                    </motion.button>

                    {!isRecording ? (
                        <motion.button
                            onClick={startRecording}
                            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-xl flex items-center gap-2 font-semibold transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Mic size={20} />
                            <span>Record Poem</span>
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
                                        {recording.title}
                                    </p>
                                    {recording.style && (
                                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded mt-1">
                                            {recording.style}
                                        </span>
                                    )}
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

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmModal.isOpen}
                onClose={() => setDeleteConfirmModal({ isOpen: false, poemId: null })}
                onConfirm={confirmDeletePoem}
                title="Delete Poem"
                message="Are you sure you want to delete this poem? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
            />

            {/* Draft Recovery Modal */}
            {showDraftRecovery && (
                <DraftRecovery
                    storageKey={storageKey}
                    onRecover={handleRecoverDraft}
                    onDiscard={handleDiscardDraft}
                    onClose={() => setShowDraftRecovery(false)}
                    title="Recover Poem Draft"
                />
            )}
        </div>
    );
};

export default PoemCreator;

