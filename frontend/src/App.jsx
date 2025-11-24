import React, { useEffect, useRef, Suspense, lazy } from 'react';
import TextInput from './components/TextInput';
import Controls from './components/Controls';
import ImageUpload from './components/ImageUpload';
import Layout from './components/Layout';
import ErrorDisplay from './components/ErrorDisplay';
import ProgressIndicator from './components/ProgressIndicator';
import ToastContainer from './components/Toast';
import { useApp } from './context/AppContext';
import { getVoices, generateSpeech, generateAvatar, cancelAllRequests } from './api';
import { motion } from 'framer-motion';
import { useToast } from './hooks/useToast';

// Lazy load heavy components that are only shown conditionally
const AudioPlayer = lazy(() => import('./components/AudioPlayer'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));

// Loading fallback for lazy components
const ComponentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

function App() {
    const {
        state,
        setActiveTab,
        setText,
        setVoices,
        setSelectedVoice,
        setSpeed,
        setImage,
        setAudioUrl,
        setVideoUrl,
        setLoading,
        setError,
        setProgress,
        setTextValid,
        setImageValid,
        clearError,
        clearOutput,
    } = useApp();

    const { toasts, removeToast, success, error: showErrorToast, info } = useToast();
    const requestIdRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelAllRequests();
            if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
            if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
        };
    }, []);

    // Fetch voices on mount
    useEffect(() => {
        const fetchVoices = async () => {
            try {
                clearError();
                const data = await getVoices();
                setVoices(data.voices);
                if (data.voices.length > 0 && !state.selectedVoice) {
                    setSelectedVoice(data.voices[0]);
                }
            } catch (err) {
                console.error('Failed to load voices:', err);
                setError(err.message || 'Failed to load voices. Is the backend running?');
            }
        };

        fetchVoices();
    }, []);

    // Calculate estimated time for avatar generation
    const getEstimatedTime = (progress) => {
        if (!progress || progress === 0) return null;
        const elapsed = Date.now() - (requestIdRef.current?.startTime || Date.now());
        const remaining = (elapsed / progress) * (100 - progress);
        const minutes = Math.ceil(remaining / 60000);
        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        return null;
    };

    const handleGenerate = async () => {
        // Validation
        if (!state.text.trim()) {
            setError('Please enter some text to generate');
            return;
        }

        if (!state.isTextValid) {
            setError('Please fix the text validation errors before generating');
            return;
        }

        if (state.activeTab === 'avatar' && !state.image) {
            setError('Please upload an image for avatar generation');
            return;
        }

        if (state.activeTab === 'avatar' && !state.isImageValid) {
            setError('Please fix the image validation errors before generating');
            return;
        }

        // Cancel any existing requests
        if (requestIdRef.current?.id) {
            cancelAllRequests();
        }

        // Generate unique request ID
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        requestIdRef.current = { id: requestId, startTime: Date.now() };

        setLoading(true);
        setError(null);
        clearOutput();
        setProgress(0);

        try {
            if (state.activeTab === 'avatar' && state.image) {
                // Generate Avatar Video with progress tracking
                const videoBlob = await generateAvatar(
                    state.text,
                    state.selectedVoice,
                    state.speed,
                    state.image,
                    {
                        requestId,
                        onProgress: (progress) => {
                            setProgress(progress);
                        },
                    }
                );
                const url = URL.createObjectURL(videoBlob);
                setVideoUrl(url);
                success('Avatar video generated successfully!', 'Generation Complete');
            } else {
                // Generate Audio Only with progress tracking
                const audioBlob = await generateSpeech(state.text, state.selectedVoice, state.speed, {
                    requestId,
                    onProgress: (progress) => {
                        setProgress(progress);
                    },
                });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                success('Audio generated successfully!', 'Generation Complete');
            }
            setProgress(100);
        } catch (err) {
            console.error('Generation failed:', err);
            const errorMessage = err.message || 'Failed to generate content. Please try again.';
            setError(errorMessage);
            showErrorToast(errorMessage, 'Generation Error');
            setProgress(null);
        } finally {
            setLoading(false);
            // Clear progress after a delay
            setTimeout(() => setProgress(null), 2000);
            requestIdRef.current = null;
        }
    };

    const canGenerate = () => {
        if (!state.text.trim() || !state.isTextValid) return false;
        if (state.activeTab === 'avatar') {
            return state.image && state.isImageValid;
        }
        return true;
    };

    const handleCancel = () => {
        cancelAllRequests();
        setLoading(false);
        setProgress(null);
        requestIdRef.current = null;
        info('Generation cancelled', 'Cancelled');
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + Enter to generate
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !state.isLoading && canGenerate()) {
                e.preventDefault();
                handleGenerate();
            }
            // Escape to cancel
            if (e.key === 'Escape' && state.isLoading) {
                e.preventDefault();
                handleCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isLoading, state.text, state.isTextValid, state.image, state.isImageValid, state.activeTab]);

    return (
        <Layout activeTab={state.activeTab} setActiveTab={setActiveTab}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            
            <div className="max-w-4xl mx-auto w-full">
                <motion.div 
                    className="mb-6 md:mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {state.activeTab === 'tts' ? 'Text to Speech' : 'Avatar Studio'}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base">
                        {state.activeTab === 'tts'
                            ? 'Transform your text into lifelike speech with our advanced AI models.'
                            : 'Bring your text to life with AI-generated talking avatars.'}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                    {/* Left Column: Inputs */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        <motion.div 
                            className="glass-card p-4 md:p-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <ErrorDisplay error={state.error} onDismiss={clearError} />

                            <TextInput text={state.text} setText={setText} onValidationChange={setTextValid} />

                            {state.activeTab === 'avatar' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6"
                                >
                                    <ImageUpload
                                        image={state.image}
                                        setImage={setImage}
                                        onValidationChange={setImageValid}
                                    />
                                </motion.div>
                            )}
                        </motion.div>

                        <motion.div 
                            className="glass-card p-4 md:p-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <Controls
                                voices={state.voices}
                                selectedVoice={state.selectedVoice}
                                setSelectedVoice={setSelectedVoice}
                                speed={state.speed}
                                setSpeed={setSpeed}
                                onGenerate={handleGenerate}
                                onCancel={handleCancel}
                                isLoading={state.isLoading}
                                canGenerate={canGenerate()}
                            />
                        </motion.div>
                    </div>

                    {/* Right Column: Output */}
                    <div className="lg:col-span-1">
                        <motion.div 
                            className="glass-card p-4 md:p-6 h-full min-h-[300px] md:min-h-[400px] flex flex-col"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <h3 className="text-base md:text-lg font-semibold text-white mb-4">Output</h3>

                            <div className="flex-1 flex flex-col gap-4">
                                {state.activeTab === 'tts' && state.audioUrl && (
                                    <Suspense fallback={<ComponentLoader />}>
                                        <AudioPlayer audioUrl={state.audioUrl} />
                                    </Suspense>
                                )}

                                {state.activeTab === 'avatar' && state.videoUrl && (
                                    <Suspense fallback={<ComponentLoader />}>
                                        <VideoPlayer videoUrl={state.videoUrl} />
                                    </Suspense>
                                )}

                                {!state.audioUrl && !state.videoUrl && !state.isLoading && (
                                    <motion.div 
                                        className="flex-1 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-800 rounded-xl p-8 text-center"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="max-w-xs">
                                            {state.activeTab === 'tts' ? (
                                                <>
                                                    <div className="mb-4 flex justify-center">
                                                        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-medium text-gray-400 mb-2">No audio generated yet</p>
                                                    <p className="text-xs text-gray-600">Enter your text and click Generate to create speech audio</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mb-4 flex justify-center">
                                                        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-medium text-gray-400 mb-2">No avatar video generated yet</p>
                                                    <p className="text-xs text-gray-600">Upload an image, enter text, and click Generate to create a talking avatar</p>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {state.isLoading && (
                                    <ProgressIndicator
                                        progress={state.progress}
                                        message={
                                            state.activeTab === 'avatar'
                                                ? 'Generating avatar video...'
                                                : 'Generating speech...'
                                        }
                                        estimatedTime={
                                            state.activeTab === 'avatar' ? getEstimatedTime(state.progress) : null
                                        }
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default App;
