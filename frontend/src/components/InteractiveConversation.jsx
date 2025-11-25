import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Send, Loader2, MessageCircle, X, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import TypingText from './TypingText';
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const InteractiveConversation = () => {
    const [topic, setTopic] = useState('');
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingMessageId, setTypingMessageId] = useState(null);

    // Video and audio states
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [currentAudio, setCurrentAudio] = useState(null);

    // Refs
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);

    const { success, error: showError } = useToast();

    // Initialize video stream
    useEffect(() => {
        if (isVideoEnabled && isConversationActive) {
            startVideo();
        } else {
            stopVideo();
        }

        return () => {
            stopVideo();
        };
    }, [isVideoEnabled, isConversationActive]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false // We'll handle audio separately if needed
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            logger.error('Error accessing camera', err);
            showError('Failed to access camera. Please check permissions.');
            setIsVideoEnabled(false);
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startConversation = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setIsLoading(true);
        setError(null);
        setMessages([]);

        try {
            const response = await fetch(`${API_BASE_URL}/conversation/interactive/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    voice: 'af_bella',
                    speed: 1.0
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start conversation');
            }

            const data = await response.json();

            // Add AI's opening message with typing animation
            const aiMessage = {
                id: Date.now(),
                role: 'assistant',
                content: data.message,
                audioUrl: data.audio_url,
                timestamp: new Date().toISOString(),
                isTyping: true
            };

            setMessages([aiMessage]);
            setTypingMessageId(aiMessage.id);
            setIsConversationActive(true);
            success('Conversation started!');

            // Play audio after typing completes
            if (data.audio_url && !isMuted) {
                // Delay audio to sync with typing animation
                setTimeout(() => {
                    playAudio(data.audio_url);
                }, Math.min(data.message.length * 30, 3000));
            }

        } catch (err) {
            const errorMsg = err.message || 'Failed to start conversation';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!userMessage.trim() || isLoading) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: userMessage.trim(),
            timestamp: new Date().toISOString()
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMsg]);
        const messageToSend = userMessage.trim();
        setUserMessage('');
        setIsLoading(true);

        try {
            // Format conversation history for API
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch(`${API_BASE_URL}/conversation/interactive/continue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    user_message: messageToSend,
                    conversation_history: conversationHistory,
                    voice: 'af_bella',
                    speed: 1.0
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to get response');
            }

            const data = await response.json();

            // Add AI's response with typing animation
            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                audioUrl: data.audio_url,
                timestamp: new Date().toISOString(),
                isTyping: true
            };

            setMessages(prev => [...prev, aiMessage]);
            setTypingMessageId(aiMessage.id);

            // Play audio after typing completes
            if (data.audio_url && !isMuted) {
                // Delay audio to sync with typing animation
                setTimeout(() => {
                    playAudio(data.audio_url);
                }, Math.min(data.message.length * 30, 3000));
            }

        } catch (err) {
            const errorMsg = err.message || 'Failed to send message';
            showError(errorMsg);
            // Remove user message on error
            setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = (audioUrl) => {
        if (!audioUrl) return;

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Create new audio element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
            audioRef.current = null;
        };

        audio.onerror = (err) => {
            logger.error('Error playing audio', err);
            audioRef.current = null;
        };

        audio.play().catch(err => {
            logger.error('Error playing audio', err);
            audioRef.current = null;
        });
    };

    const stopConversation = () => {
        setIsConversationActive(false);
        setMessages([]);
        setUserMessage('');
        stopVideo();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        success('Conversation ended');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-white mb-2">
                    Interactive Conversation Practice
                </h1>
                <p className="text-gray-400">
                    Practice tough conversations on any topic. The AI will keep the conversation going with a "yes, and" attitude.
                </p>
            </motion.div>

            {/* Horizontal Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

            {/* Topic Input Section - Only show when conversation not active */}
            <AnimatePresence>
                {!isConversationActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Enter a topic to practice discussing
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isLoading) {
                                            startConversation();
                                        }
                                    }}
                                    placeholder="e.g., climate change, difficult workplace conversations, politics..."
                                    className="input-field w-full"
                                    disabled={isLoading}
                                />
                            </div>
                            <motion.button
                                onClick={startConversation}
                                disabled={isLoading || !topic.trim()}
                                className="btn-primary flex items-center gap-2 min-h-[44px] px-6"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Starting...</span>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={18} />
                                        <span>Start Conversation</span>
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
                )}
            </AnimatePresence>

            {/* Main Conversation Area */}
            <AnimatePresence mode="wait">
                {isConversationActive && (
                    <motion.div
                        key="conversation-active"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0"
                    >
                        {/* Video Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:w-1/3 flex flex-col gap-4"
                        >
                            <div className="glass-card p-4 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">Your Video</h2>
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                            className={`p-2 rounded-lg transition-colors ${isVideoEnabled
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                                        </motion.button>
                                        <motion.button
                                            onClick={() => {
                                                setIsMuted(!isMuted);
                                                if (!isMuted && audioRef.current) {
                                                    audioRef.current.pause();
                                                }
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${isMuted
                                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                                }`}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
                                    {isVideoEnabled ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <VideoOff size={48} className="text-gray-500" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Chat Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:w-2/3 flex flex-col glass-card p-6 min-h-0"
                        >
                            {/* Chat Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold text-white truncate">Conversation: {topic}</h2>
                                    <p className="text-sm text-gray-400">Practice speaking naturally</p>
                                </div>
                                <motion.button
                                    onClick={stopConversation}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0">
                                <AnimatePresence mode="popLayout">
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            layout
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <motion.div
                                                layout
                                                initial={false}
                                                className={`max-w-[80%] min-w-[120px] rounded-xl p-4 ${message.role === 'user'
                                                        ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
                                                        : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                                                    }`}
                                            >
                                                {message.role === 'assistant' && message.isTyping && typingMessageId === message.id ? (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-container">
                                                        <TypingText
                                                            text={message.content}
                                                            speed={30}
                                                            className="message-bubble"
                                                            onComplete={() => {
                                                                setMessages(prev => prev.map(msg =>
                                                                    msg.id === message.id
                                                                        ? { ...msg, isTyping: false }
                                                                        : msg
                                                                ));
                                                                setTypingMessageId(null);
                                                            }}
                                                        />
                                                    </p>
                                                ) : (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="text-sm leading-relaxed whitespace-pre-wrap text-container"
                                                    >
                                                        {message.content}
                                                    </motion.p>
                                                )}
                                                {message.role === 'assistant' && message.audioUrl && !message.isTyping && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        onClick={() => playAudio(message.audioUrl)}
                                                        className="mt-2 p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <Volume2 size={14} />
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 min-w-[60px]">
                                            <Loader2 className="animate-spin text-blue-400" size={20} />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-700 flex-shrink-0">
                                <input
                                    type="text"
                                    value={userMessage}
                                    onChange={(e) => setUserMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="input-field flex-1 min-w-0"
                                    disabled={isLoading}
                                />
                                <motion.button
                                    onClick={sendMessage}
                                    disabled={isLoading || !userMessage.trim()}
                                    className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveConversation;

