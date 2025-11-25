import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Pause, Trash2, Loader2, FileText, Search, X, Volume2, Clock } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAutoSave } from '../hooks/useAutoSave';
import { createSpeech, getSpeeches, deleteSpeech, generateSpeech } from '../api';
import AudioPlayer from './AudioPlayer';
import DraftRecovery from './DraftRecovery';
import ConfirmationModal from './ConfirmationModal';
import logger from '../utils/logger';

// Comprehensive topic list from ideas copy.txt
const DEFAULT_TOPICS = [
    "How in the Present Moment",
    "Nuclear Physics",
    "Meditation",
    "Emotions",
    "Ichthyology",
    "Chess",
    "Physics",
    "The country of Georgia",
    "Business & Professional Excellence",
    "Why give a speech",
    "Information Architecture",
    "Business Intelligence",
    "The Beach Ecosystem at fire island",
    "Ornithology",
    "Meaning",
    "Data Analytics",
    "Writing well",
    "Theoretical Physics",
    "Experimental Physics",
    "Astrophysics",
    "Condensed Matter Physics",
    "Particle Physics",
    "Quantum Mechanics",
    "Optics",
    "Chemistry",
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Analytical Chemistry",
    "Biochemistry",
    "Biology",
    "Molecular Biology",
    "Cell Biology",
    "Genetics",
    "Evolutionary Biology",
    "Ecology",
    "Marine Biology",
    "Biotechnology",
    "Earth Sciences",
    "Geology",
    "Oceanography",
    "Meteorology",
    "Climatology",
    "Paleontology",
    "Environmental Science",
    "Astronomy",
    "Theoretical Astronomy",
    "Cosmology",
    "Planetary Science",
    "Neuroscience",
    "Cognitive Neuroscience",
    "Behavioral Neuroscience",
    "Psychology",
    "Clinical Psychology",
    "Cognitive Psychology",
    "Social Psychology",
    "Sociology",
    "Anthropology",
    "Cultural Anthropology",
    "Archaeology",
    "Economics",
    "Microeconomics",
    "Macroeconomics",
    "Behavioral Economics",
    "Political Science",
    "International Relations",
    "Geography",
    "History",
    "Ancient History",
    "Medieval History",
    "Modern History",
    "Linguistics",
    "Communication Studies",
    "Media Studies",
    "Philosophy",
    "Metaphysics",
    "Epistemology",
    "Ethics",
    "Aesthetics",
    "Logic",
    "Philosophy of Science",
    "Philosophy of Mind",
    "Art History",
    "Renaissance Art",
    "Modern Art",
    "Contemporary Art",
    "Literature",
    "Comparative Literature",
    "World Literature",
    "Musicology",
    "Music Theory",
    "Theater Studies",
    "Film Studies",
    "Mathematics",
    "Algebra",
    "Geometry",
    "Calculus",
    "Statistics",
    "Number Theory",
    "Computer Science",
    "Artificial Intelligence",
    "Machine Learning",
    "Software Engineering",
    "Cybersecurity",
    "Data Science",
    "Game Theory",
    "Cryptography",
    "Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Medicine",
    "General Medicine",
    "Surgery",
    "Pediatrics",
    "Psychiatry",
    "Public Health",
    "Epidemiology",
    "Business Administration",
    "Strategic Management",
    "Operations Management",
    "Entrepreneurship",
    "Finance",
    "Corporate Finance",
    "Investment Banking",
    "Marketing",
    "Digital Marketing",
    "Leadership",
    "Project Management",
    "Education",
    "Educational Psychology",
    "Sustainability Studies",
    "Environmental Policy",
    "Sustainable Development",
    "Climate Change Mitigation",
    "Renewable Energy",
    "Global Studies",
    "International Development",
    "Science, Technology, and Society",
    "Innovation Studies",
    "Peace and Conflict Studies",
    "Human Rights",
    "Time Management",
    "Public Speaking",
    "Confidence",
    "Goal Setting",
    "Emotional Intelligence",
    "Productivity",
    "Creative Writing",
    "Speed Reading",
    "Negotiation",
    "Graphic Design",
    "Photography",
    "Video Editing",
    "Music Production",
    "Real Estate Investing",
    "Stock Market Investing",
    "Cryptocurrency Investing",
    "Personal Finance",
    "Language Learning",
    "Cross-Cultural Communication"
];

const SpeechPractice = () => {
    const [topic, setTopic] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [speeches, setSpeeches] = useState([]);
    const [currentSpeech, setCurrentSpeech] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTopicList, setShowTopicList] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('af_bella');
    const [speed, setSpeed] = useState(1.0);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, speechId: null });
    const [showDraftRecovery, setShowDraftRecovery] = useState(false);
    
    const { success, error: showError } = useToast();

    // Auto-save hook for topic
    const storageKey = 'speech_practice_draft';
    const { isSaving, lastSaved, hasUnsavedChanges, clearDraft, recoverDraft } = useAutoSave(
        storageKey,
        { topic, selectedTopic },
        {
            interval: 30000,
            saveOnBlur: true,
            saveBeforeUnload: true,
        }
    );

    // Check for draft on mount
    useEffect(() => {
        const draft = recoverDraft();
        if (draft && draft.topic) {
            setShowDraftRecovery(true);
        }
    }, [recoverDraft]);

    // Load speeches on mount
    useEffect(() => {
        loadSpeeches();
    }, []);

    const loadSpeeches = async () => {
        try {
            const data = await getSpeeches(0, 50);
            setSpeeches(data.speeches || []);
        } catch (err) {
            logger.error('Failed to load speeches', err);
        }
    };

    const handleGenerateSpeech = async () => {
        if (!topic.trim()) {
            setError('Please enter or select a topic');
            showError('Please enter or select a topic');
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentSpeech(null);

        try {
            const speechData = await createSpeech(topic.trim(), {
                onProgress: (progress) => {
                    // Could show progress here
                    logger.debug('Generation progress', progress);
                }
            });
            
            setCurrentSpeech(speechData);
            setSpeeches(prev => [speechData, ...prev]);
            success('Speech generated successfully!');
            
            // Clear draft after successful generation
            clearDraft();
            setTopic(''); // Clear input
        } catch (err) {
            const errorMsg = err.message || 'Failed to generate speech';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRecoverDraft = (draftData) => {
        if (draftData.topic) setTopic(draftData.topic);
        if (draftData.selectedTopic) setSelectedTopic(draftData.selectedTopic);
        setShowDraftRecovery(false);
        success('Draft recovered');
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRecovery(false);
    };

    const handleSelectTopic = (topicName) => {
        setTopic(topicName);
        setSelectedTopic(topicName);
        setShowTopicList(false);
    };

    const handlePlayAudio = async (speech) => {
        if (audioUrl && currentSpeech?.id === speech.id) {
            // Already playing this one
            return;
        }

        try {
            setGeneratingAudio(speech.id);
            setCurrentSpeech(speech);
            
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            
            const audioBlob = await generateSpeech(
                speech.content,
                selectedVoice,
                speed
            );
            
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            success('Audio generated successfully');
        } catch (err) {
            showError(err.message || 'Failed to generate audio');
            setCurrentSpeech(null);
        } finally {
            setGeneratingAudio(null);
        }
    };

    const handleDeleteSpeech = (speechId) => {
        setDeleteConfirmModal({ isOpen: true, speechId });
    };

    const confirmDeleteSpeech = async () => {
        const { speechId } = deleteConfirmModal;
        if (!speechId) return;

        try {
            await deleteSpeech(speechId);
            setSpeeches(prev => prev.filter(s => s.id !== speechId));
            if (currentSpeech?.id === speechId) {
                setCurrentSpeech(null);
                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    setAudioUrl(null);
                }
            }
            success('Speech deleted successfully');
        } catch (err) {
            showError(err.message || 'Failed to delete speech');
        } finally {
            setDeleteConfirmModal({ isOpen: false, speechId: null });
        }
    };

    const filteredTopics = DEFAULT_TOPICS.filter(t => 
        t.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50"
            >
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Speech Practice
                </h1>
                <p className="text-gray-400 text-base md:text-lg">
                    Generate sophisticated speeches on any topic and practice with AI voice
                </p>
            </motion.div>

            {/* Topic Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 rounded-2xl border border-gray-800/50 relative"
            >
                <div className="space-y-4">
                    {/* Auto-save indicator */}
                    <div className="flex items-center justify-end gap-2 text-sm">
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
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => {
                                    setTopic(e.target.value);
                                    setShowTopicList(e.target.value.length > 0);
                                }}
                                onFocus={() => setShowTopicList(true)}
                                placeholder="Enter a topic or select from suggestions..."
                                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {topic && (
                                <button
                                    onClick={() => {
                                        setTopic('');
                                        setSelectedTopic(null);
                                        setShowTopicList(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            )}
                            
                            {/* Topic Suggestions Dropdown */}
                            <AnimatePresence>
                                {showTopicList && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                                    >
                                        {searchQuery && (
                                            <div className="p-2 border-b border-gray-700">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search topics..."
                                                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-2">
                                            {filteredTopics.length > 0 ? (
                                                filteredTopics.slice(0, 20).map((topicName, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSelectTopic(topicName)}
                                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm"
                                                    >
                                                        {topicName}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-gray-400 text-sm">No topics found</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <motion.button
                            onClick={handleGenerateSpeech}
                            disabled={loading || !topic.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:via-blue-400 hover:to-purple-500 rounded-xl text-white font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: loading ? 1 : 1.05 }}
                            whileTap={{ scale: loading ? 1 : 0.95 }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    <span>Create Speech</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                    
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Current Speech Display */}
            <AnimatePresence mode="wait">
                {currentSpeech && (
                    <motion.div
                        key={currentSpeech.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="glass-card p-6 rounded-2xl border border-gray-800/50"
                    >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 text-white">{currentSpeech.topic}</h2>
                            <p className="text-sm text-gray-400">
                                {new Date(currentSpeech.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                onClick={() => handlePlayAudio(currentSpeech)}
                                disabled={generatingAudio === currentSpeech.id}
                                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {generatingAudio === currentSpeech.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </motion.button>
                            <motion.button
                                onClick={() => handleDeleteSpeech(currentSpeech.id)}
                                className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="prose prose-invert max-w-none"
                    >
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                        >
                            {currentSpeech.content}
                        </motion.div>
                    </motion.div>
                    
                    {audioUrl && currentSpeech && (
                        <div className="mt-6">
                            <AudioPlayer audioUrl={audioUrl} />
                        </div>
                    )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Speeches List */}
            {speeches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-gray-800/50"
                >
                    <h2 className="text-2xl font-bold mb-4 text-white">Your Speeches</h2>
                    <div className="space-y-3">
                        {speeches.map((speech) => (
                            <motion.div
                                key={speech.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-colors cursor-pointer"
                                onClick={() => setCurrentSpeech(speech)}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white mb-1">{speech.topic}</h3>
                                        <p className="text-sm text-gray-400">
                                            {new Date(speech.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayAudio(speech);
                                            }}
                                            disabled={generatingAudio === speech.id}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {generatingAudio === speech.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Volume2 className="w-4 h-4" />
                                            )}
                                        </motion.button>
                                        <motion.button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSpeech(speech.id);
                                            }}
                                            className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmModal.isOpen}
                onClose={() => setDeleteConfirmModal({ isOpen: false, speechId: null })}
                onConfirm={confirmDeleteSpeech}
                title="Delete Speech"
                message="Are you sure you want to delete this speech? This action cannot be undone."
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
                    title="Recover Topic Draft"
                />
            )}
        </div>
    );
};

export default SpeechPractice;

