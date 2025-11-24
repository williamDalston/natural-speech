import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
    activeTab: 'tts',
    text: '',
    voices: [],
    selectedVoice: '',
    speed: 1.0,
    image: null,
    audioUrl: null,
    videoUrl: null,
    isLoading: false,
    error: null,
    progress: null,
    isOnline: navigator.onLine,
    // Validation states
    isTextValid: false,
    isImageValid: false,
};

// Action types
const ActionTypes = {
    SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
    SET_TEXT: 'SET_TEXT',
    SET_VOICES: 'SET_VOICES',
    SET_SELECTED_VOICE: 'SET_SELECTED_VOICE',
    SET_SPEED: 'SET_SPEED',
    SET_IMAGE: 'SET_IMAGE',
    SET_AUDIO_URL: 'SET_AUDIO_URL',
    SET_VIDEO_URL: 'SET_VIDEO_URL',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_PROGRESS: 'SET_PROGRESS',
    SET_ONLINE: 'SET_ONLINE',
    SET_TEXT_VALID: 'SET_TEXT_VALID',
    SET_IMAGE_VALID: 'SET_IMAGE_VALID',
    RESET: 'RESET',
    CLEAR_ERROR: 'CLEAR_ERROR',
    CLEAR_OUTPUT: 'CLEAR_OUTPUT',
};

// Reducer
const appReducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };
        case ActionTypes.SET_TEXT:
            return { ...state, text: action.payload };
        case ActionTypes.SET_VOICES:
            return { ...state, voices: action.payload };
        case ActionTypes.SET_SELECTED_VOICE:
            return { ...state, selectedVoice: action.payload };
        case ActionTypes.SET_SPEED:
            return { ...state, speed: action.payload };
        case ActionTypes.SET_IMAGE:
            return { ...state, image: action.payload };
        case ActionTypes.SET_AUDIO_URL:
            return { ...state, audioUrl: action.payload };
        case ActionTypes.SET_VIDEO_URL:
            return { ...state, videoUrl: action.payload };
        case ActionTypes.SET_LOADING:
            return { ...state, isLoading: action.payload };
        case ActionTypes.SET_ERROR:
            return { ...state, error: action.payload };
        case ActionTypes.SET_PROGRESS:
            return { ...state, progress: action.payload };
        case ActionTypes.SET_ONLINE:
            return { ...state, isOnline: action.payload };
        case ActionTypes.SET_TEXT_VALID:
            return { ...state, isTextValid: action.payload };
        case ActionTypes.SET_IMAGE_VALID:
            return { ...state, isImageValid: action.payload };
        case ActionTypes.RESET:
            return {
                ...initialState,
                voices: state.voices,
                selectedVoice: state.selectedVoice,
                activeTab: state.activeTab,
            };
        case ActionTypes.CLEAR_ERROR:
            return { ...state, error: null };
        case ActionTypes.CLEAR_OUTPUT:
            return { ...state, audioUrl: null, videoUrl: null, progress: null };
        default:
            return state;
    }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Load persisted state from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('natural-speech-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Only restore safe state (not URLs or files)
                if (parsed.selectedVoice) {
                    dispatch({ type: ActionTypes.SET_SELECTED_VOICE, payload: parsed.selectedVoice });
                }
                if (parsed.speed) {
                    dispatch({ type: ActionTypes.SET_SPEED, payload: parsed.speed });
                }
                if (parsed.activeTab) {
                    dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: parsed.activeTab });
                }
            }
        } catch (error) {
            console.error('Failed to load persisted state:', error);
        }
    }, []);

    // Persist certain state to localStorage
    useEffect(() => {
        try {
            const toPersist = {
                selectedVoice: state.selectedVoice,
                speed: state.speed,
                activeTab: state.activeTab,
            };
            localStorage.setItem('natural-speech-state', JSON.stringify(toPersist));
        } catch (error) {
            console.error('Failed to persist state:', error);
        }
    }, [state.selectedVoice, state.speed, state.activeTab]);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => dispatch({ type: ActionTypes.SET_ONLINE, payload: true });
        const handleOffline = () => {
            dispatch({ type: ActionTypes.SET_ONLINE, payload: false });
            dispatch({ type: ActionTypes.SET_ERROR, payload: 'You are offline. Please check your connection.' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup URLs when component unmounts
    useEffect(() => {
        return () => {
            if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
            if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
        };
    }, []);

    const value = {
        state,
        dispatch,
        // Helper actions
        setActiveTab: (tab) => dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab }),
        setText: (text) => dispatch({ type: ActionTypes.SET_TEXT, payload: text }),
        setVoices: (voices) => dispatch({ type: ActionTypes.SET_VOICES, payload: voices }),
        setSelectedVoice: (voice) => dispatch({ type: ActionTypes.SET_SELECTED_VOICE, payload: voice }),
        setSpeed: (speed) => dispatch({ type: ActionTypes.SET_SPEED, payload: speed }),
        setImage: (image) => dispatch({ type: ActionTypes.SET_IMAGE, payload: image }),
        setAudioUrl: (url) => dispatch({ type: ActionTypes.SET_AUDIO_URL, payload: url }),
        setVideoUrl: (url) => dispatch({ type: ActionTypes.SET_VIDEO_URL, payload: url }),
        setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
        setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
        setProgress: (progress) => dispatch({ type: ActionTypes.SET_PROGRESS, payload: progress }),
        setTextValid: (valid) => dispatch({ type: ActionTypes.SET_TEXT_VALID, payload: valid }),
        setImageValid: (valid) => dispatch({ type: ActionTypes.SET_IMAGE_VALID, payload: valid }),
        reset: () => dispatch({ type: ActionTypes.RESET }),
        clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
        clearOutput: () => dispatch({ type: ActionTypes.CLEAR_OUTPUT }),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppContext;

