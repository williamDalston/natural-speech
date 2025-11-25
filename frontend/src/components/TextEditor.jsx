import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createWriting, updateWriting, generateSpeech, getVoices } from '../api';
import { useToast } from '../hooks/useToast';
import AudioPlayer from './AudioPlayer';
import Controls from './Controls';

const TextEditor = ({ writing: initialWriting, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('af_bella');
    const [speed, setSpeed] = useState(1.0);
    const [voices, setVoices] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [saving, setSaving] = useState(false);
    const { success, error: showError } = useToast();

    useEffect(() => {
        if (initialWriting) {
            setTitle(initialWriting.title || '');
            setContent(initialWriting.content || '');
            setAuthor(initialWriting.author || '');
        }
    }, [initialWriting]);

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
                console.error('Failed to load voices:', err);
            }
        };
        loadVoices();
    }, []);

    const handleSave = async () => {
        if (!content.trim()) {
            showError('Content cannot be empty');
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
            showError(err.message || 'Failed to save writing');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!content.trim()) {
            showError('Please enter some text first');
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
            showError(err.message || 'Failed to generate audio');
        } finally {
            setGeneratingAudio(false);
        }
    };

    const handlePaste = async (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        setContent(prev => prev + pastedText);
    };

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    return (
        <div className="w-full h-full flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        {initialWriting ? 'Edit Writing' : 'New Writing'}
                    </h2>
                    <div className="flex gap-3">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || !content.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {initialWriting ? 'Update' : 'Save'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Title (optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title..."
                            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Author (optional)
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Enter author name..."
                            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Content Editor */}
                <div className="glass-card p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-400">
                            Content *
                        </label>
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span>{wordCount} words</span>
                            <span>{charCount} characters</span>
                        </div>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Paste or type your wonderful writing here..."
                        className="flex-1 w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-serif text-lg leading-relaxed"
                    />
                </div>

                {/* Horizontal Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

                {/* Audio Controls */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Audio Preview</h3>
                        <button
                            onClick={handleGenerateAudio}
                            disabled={generatingAudio || !content.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                            {generatingAudio ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                    Generate Audio
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

