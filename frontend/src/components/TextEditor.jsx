import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { createWriting, updateWriting, generateSpeech, getVoices } from '../api';
import { useToast } from '../hooks/useToast';
import { useAutoSave } from '../hooks/useAutoSave';
import { useMobile, useReducedMotion } from '../hooks/useMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useEditorShortcuts } from '../hooks/useEditorShortcuts';
import AudioPlayer from './AudioPlayer';
import Controls from './Controls';
import DraftRecovery from './DraftRecovery';
import { Save, Clock, Maximize2, Minimize2 } from 'lucide-react';
import logger from '../utils/logger';

const TextEditor = forwardRef(({ writing: initialWriting, onSave, onCancel, onSaveRef }, ref) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('af_bella');
    const [speed, setSpeed] = useState(1.0);
    const [voices, setVoices] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDraftRecovery, setShowDraftRecovery] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const contentTextareaRef = useRef(null);
    const { success, error: showError } = useToast();
    const { isMobile, isTouchDevice } = useMobile();
    const prefersReducedMotion = useReducedMotion();

    // Auto-save hook
    const storageKey = initialWriting 
        ? `writing_draft_${initialWriting.id}` 
        : 'writing_draft_new';
    
    const { isSaving, lastSaved, hasUnsavedChanges, clearDraft, recoverDraft } = useAutoSave(
        storageKey,
        { title, content, author },
        {
            interval: 30000, // 30 seconds
            saveOnBlur: true,
            saveBeforeUnload: true,
            onSave: (savedData) => {
                // Save to history
                try {
                    const historyKey = `${storageKey}_history`;
                    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
                    history.unshift({
                        data: savedData,
                        timestamp: savedData._timestamp,
                    });
                    // Keep only last 5
                    const trimmedHistory = history.slice(0, 5);
                    localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
                } catch (error) {
                    logger.error('Failed to save to history', error);
                }
            },
        }
    );

    // Editor shortcuts
    useEditorShortcuts({
        onGenerateAudio: handleGenerateAudio,
        canGenerate: !!content.trim() && !generatingAudio,
        isGenerating: generatingAudio,
        textareaRef: contentTextareaRef,
        disableWhenTyping: false, // Allow shortcuts even when typing
    });

    // Check for draft on mount (only for new writings)
    useEffect(() => {
        if (!initialWriting) {
            const draft = recoverDraft();
            if (draft && (draft.title || draft.content || draft.author)) {
                setShowDraftRecovery(true);
            }
        }
    }, [initialWriting, recoverDraft]);

    useEffect(() => {
        if (initialWriting) {
            setTitle(initialWriting.title || '');
            setContent(initialWriting.content || '');
            setAuthor(initialWriting.author || '');
            // Clear draft when loading existing writing
            clearDraft();
        }
    }, [initialWriting, clearDraft]);

    useEffect(() => {
        // Load voices
        const loadVoices = async () => {
            try {
                const data = await getVoices();
                setVoices(data.voices || []);
                if (data.voices && data.voices.length > 0 && !selectedVoice) {
                    setSelectedVoice(data.voices[0]);
                }
            } catch (err) {
                logger.error('Failed to load voices', err);
            }
        };
        loadVoices();
    }, []);

    // Editor keyboard shortcuts
    useEditorShortcuts({
        onGenerate: handleGenerateAudio,
        canGenerate: !!content.trim() && !generatingAudio,
        isLoading: generatingAudio,
        enabled: true
    });

    const handleSave = async () => {
        if (!content.trim()) {
            showError('Content cannot be empty. Please add some text before saving.');
            return;
        }

        try {
            setSaving(true);
            if (initialWriting) {
                await updateWriting(initialWriting.id, { title, content, author });
                success('Writing updated successfully');
            } else {
                await createWriting({ title, content, author });
                success('Writing saved successfully');
            }
            
            // Clear draft after successful save
            clearDraft();
            
            if (onSave) {
                onSave();
            }
            // Reset form if new writing
            if (!initialWriting) {
                setTitle('');
                setContent('');
                setAuthor('');
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to save writing';
            showError(`${errorMessage}. Please check your connection and try again.`);
        } finally {
            setSaving(false);
        }
    };

    // Expose save function to parent via ref
    useImperativeHandle(ref, () => ({
        save: handleSave
    }));

    // Expose save function via callback
    useEffect(() => {
        if (onSaveRef) {
            onSaveRef(handleSave);
        }
    }, [onSaveRef]);

    const handleRecoverDraft = (draftData) => {
        if (draftData.title) setTitle(draftData.title);
        if (draftData.content) setContent(draftData.content);
        if (draftData.author) setAuthor(draftData.author);
        setShowDraftRecovery(false);
        success('Draft recovered');
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRecovery(false);
    };

    const handleGenerateAudio = async () => {
        if (!content.trim()) {
            showError('Please enter some text first to generate audio.');
            return;
        }

        try {
            setGeneratingAudio(true);
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
            }

            const audioBlob = await generateSpeech(content, selectedVoice, speed);
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            success('Audio generated successfully');
        } catch (err) {
            const errorMessage = err.message || 'Failed to generate audio';
            showError(`${errorMessage}. This may take a moment for longer texts. Please try again.`);
        } finally {
            setGeneratingAudio(false);
        }
    };

    // Editor shortcuts (after handleGenerateAudio is defined)
    useEditorShortcuts({
        onGenerateAudio: handleGenerateAudio,
        canGenerate: !!content.trim() && !generatingAudio,
        isGenerating: generatingAudio,
        textareaRef: contentTextareaRef,
        disableWhenTyping: false, // Allow shortcuts even when typing
    });

    const handlePaste = async (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        setContent(prev => prev + pastedText);
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        if (!isFullScreen && isMobile) {
            // Enter fullscreen on mobile
            document.documentElement.requestFullscreen?.().catch(() => {});
        }
    };

    // Touch gestures for mobile navigation
    const touchRef = useTouchGestures({
        onSwipeLeft: () => {
            if (isMobile && onCancel) {
                onCancel();
            }
        },
        swipeThreshold: 100,
    });

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    // Animation variants based on reduced motion preference
    const containerVariants = prefersReducedMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } };

    // Touch gestures for mobile navigation
    const touchRef = useTouchGestures({
        onSwipeLeft: () => {
            if (isMobile && onCancel) {
                onCancel();
            }
        },
        swipeThreshold: 100,
    });

    // Animation variants based on reduced motion preference
    const containerVariants = prefersReducedMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } };

    return (
        <div 
            ref={touchRef}
            className={`w-full h-full flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0a0a0a]' : ''}`}
        >
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className={`flex-1 flex flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between ${isMobile ? 'flex-wrap gap-2' : ''}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2 flex-wrap' : 'gap-3'}`}>
                        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white flex-1 min-w-0`}>
                            {initialWriting ? 'Edit Writing' : 'New Writing'}
                        </h2>
                        {/* Auto-save indicator */}
                        <div className="flex items-center gap-2 text-sm">
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
                            {hasUnsavedChanges && !isSaving && (
                                <span className="text-xs text-yellow-400">Unsaved changes</span>
                            )}
                        </div>
                    </div>
                    <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                        {/* Full-screen toggle (mobile only) */}
                        {isMobile && (
                            <button
                                onClick={toggleFullScreen}
                                className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
                            >
                                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                        )}
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className={`${isMobile ? 'px-3 py-2.5 text-sm min-h-[44px]' : 'px-4 py-2'} bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors touch-manipulation`}
                                aria-label="Cancel editing"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || !content.trim()}
                            className={`${isMobile ? 'px-3 py-2.5 text-sm min-h-[44px]' : 'px-4 py-2'} bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2 touch-manipulation`}
                            aria-label={initialWriting ? 'Update writing' : 'Save writing'}
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className={isMobile ? 'hidden sm:inline' : ''}>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>{initialWriting ? 'Update' : 'Save'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Draft Recovery Modal */}
                {showDraftRecovery && (
                    <DraftRecovery
                        storageKey={storageKey}
                        onRecover={handleRecoverDraft}
                        onDiscard={handleDiscardDraft}
                        onClose={() => setShowDraftRecovery(false)}
                        title="Recover Writing Draft"
                    />
                )}

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                {/* Form Fields */}
                <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-4`}>
                    <div className={`glass-card ${isMobile ? 'p-3' : 'p-4'}`}>
                        <label htmlFor="writing-title" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-400 mb-2`}>
                            Title (optional)
                        </label>
                        <input
                            id="writing-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title..."
                            className={`w-full ${isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-2'} bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                            aria-label="Writing title"
                        />
                    </div>

                    <div className={`glass-card ${isMobile ? 'p-3' : 'p-4'}`}>
                        <label htmlFor="writing-author" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-400 mb-2`}>
                            Author (optional)
                        </label>
                        <input
                            id="writing-author"
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Enter author name..."
                            className={`w-full ${isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-2'} bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation`}
                            aria-label="Author name"
                        />
                    </div>
                </div>

                {/* Content Editor */}
                <div className={`glass-card ${isMobile ? 'p-3' : 'p-4'} flex-1 flex flex-col ${isFullScreen && isMobile ? 'min-h-0' : ''}`}>
                    <div className={`flex items-center justify-between ${isMobile ? 'mb-2 flex-wrap gap-2' : 'mb-3'}`}>
                        <label htmlFor="writing-content" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-400`}>
                            Content *
                        </label>
                        <div className={`flex ${isMobile ? 'gap-2 text-xs' : 'gap-4 text-xs'} text-gray-500`}>
                            <span>{wordCount} words</span>
                            <span>{charCount} chars</span>
                        </div>
                    </div>
                    <textarea
                        ref={contentTextareaRef}
                        onKeyDown={(e) => {
                            // Handle Tab for indentation
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                const textarea = e.target;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const value = textarea.value;
                                
                                if (e.shiftKey) {
                                    // Outdent: Remove leading spaces/tabs
                                    const lines = value.substring(start, end).split('\n');
                                    const outdentedLines = lines.map(line => {
                                        if (line.startsWith('  ')) {
                                            return line.substring(2);
                                        } else if (line.startsWith('\t')) {
                                            return line.substring(1);
                                        }
                                        return line;
                                    });
                                    const newValue = value.substring(0, start) + 
                                                   outdentedLines.join('\n') + 
                                                   value.substring(end);
                                    setContent(newValue);
                                    // Restore cursor position
                                    setTimeout(() => {
                                        textarea.selectionStart = start;
                                        textarea.selectionEnd = start + (outdentedLines.join('\n').length);
                                    }, 0);
                                } else {
                                    // Indent: Add 2 spaces
                                    const lines = value.substring(start, end).split('\n');
                                    const indentedLines = lines.map(line => '  ' + line);
                                    const newValue = value.substring(0, start) + 
                                                   indentedLines.join('\n') + 
                                                   value.substring(end);
                                    setContent(newValue);
                                    // Restore cursor position
                                    setTimeout(() => {
                                        textarea.selectionStart = start + 2;
                                        textarea.selectionEnd = start + 2 + (indentedLines.join('\n').length);
                                    }, 0);
                                }
                            }
                        }}
                        id="writing-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Paste or type your wonderful writing here..."
                        className={`flex-1 w-full ${isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3 text-lg'} bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-serif leading-relaxed touch-manipulation ${isFullScreen && isMobile ? 'min-h-0' : ''}`}
                        aria-label="Writing content"
                        aria-required="true"
                        style={{
                            fontSize: isMobile ? '16px' : undefined, // Prevent iOS zoom
                        }}
                    />
                </div>

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                {/* Audio Controls */}
                <div className={`glass-card ${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className={`flex items-center justify-between ${isMobile ? 'mb-3 flex-wrap gap-2' : 'mb-4'}`}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>Audio Preview</h3>
                        <button
                            onClick={handleGenerateAudio}
                            disabled={generatingAudio || !content.trim()}
                            className={`${isMobile ? 'px-3 py-2.5 text-sm min-h-[44px]' : 'px-4 py-2'} bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2 touch-manipulation`}
                            aria-label="Generate audio preview"
                        >
                            {generatingAudio ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className={isMobile ? 'hidden sm:inline' : ''}>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                    <span className={isMobile ? 'hidden sm:inline' : ''}>Generate Audio</span>
                                </>
                            )}
                        </button>
                    </div>

                    {voices.length > 0 && (
                        <Controls
                            voices={voices}
                            selectedVoice={selectedVoice}
                            setSelectedVoice={setSelectedVoice}
                            speed={speed}
                            setSpeed={setSpeed}
                            onGenerate={handleGenerateAudio}
                            isLoading={generatingAudio}
                            canGenerate={!!content.trim()}
                        />
                    )}

                    {audioUrl && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4"
                        >
                            <AudioPlayer audioUrl={audioUrl} />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TextEditor;
TextEditor.displayName = 'TextEditor';

