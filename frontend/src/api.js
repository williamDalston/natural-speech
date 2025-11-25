/**
 * API Client Module
 * 
 * This module provides a centralized API client for communicating with the
 * Natural Speech backend. It includes:
 * - Request timeout handling
 * - Automatic retry logic with exponential backoff
 * - Request cancellation support
 * - Progress tracking for long-running requests
 * - Enhanced error handling with custom error types
 * - API response caching for improved performance
 * 
 * @module api
 */

import { getCached, setCached, invalidateCache } from './utils/cache';
import offlineQueue from './utils/offlineQueue';

// Get API base URL from environment variable, fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Default configuration
const DEFAULT_TIMEOUT = 300000; // 5 minutes for avatar generation
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

// Custom error classes
export class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.data = data;
    }
}

export class TimeoutError extends Error {
    constructor(message = "Request timeout") {
        super(message);
        this.name = "TimeoutError";
    }
}

export class NetworkError extends Error {
    constructor(message = "Network error") {
        super(message);
        this.name = "NetworkError";
    }
}

// Sleep utility for retry delays
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
            throw new TimeoutError(`Request exceeded ${timeout}ms timeout`);
        }
        if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new NetworkError("Failed to connect to server. Please check your connection.");
        }
        throw error;
    }
};

// Retry wrapper with rate limit handling
const withRetry = async (fn, retries = DEFAULT_RETRY_ATTEMPTS, delay = DEFAULT_RETRY_DELAY) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Handle rate limits (429) - retry with Retry-After header
            if (error instanceof APIError && error.status === 429) {
                if (i < retries - 1) {
                    // Check for Retry-After header
                    const retryAfter = error.data?.headers?.['retry-after'] || 
                                     error.data?.headers?.['Retry-After'];
                    
                    if (retryAfter) {
                        // Wait for the specified time
                        const waitTime = parseInt(retryAfter) * 1000;
                        await sleep(waitTime);
                        continue; // Retry
                    } else {
                        // No Retry-After header, use exponential backoff with jitter
                        const baseDelay = delay * Math.pow(2, i);
                        const jitter = Math.random() * 1000; // Add randomness
                        const waitTime = Math.min(baseDelay + jitter, 30000); // Max 30s
                        await sleep(waitTime);
                        continue; // Retry
                    }
                }
                // Max retries reached for rate limit
                throw new APIError(
                    error.message || 'Rate limit exceeded. Please try again later.',
                    429,
                    error.data
                );
            }
            
            // Don't retry on other client errors (4xx except 429) or timeout errors
            if (error instanceof APIError && error.status >= 400 && error.status < 500) {
                throw error;
            }
            if (error instanceof TimeoutError) {
                throw error;
            }
            
            // Exponential backoff with jitter for other errors (5xx, network errors)
            if (i < retries - 1) {
                const baseDelay = delay * Math.pow(2, i);
                const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
                const waitTime = Math.min(baseDelay + jitter, 30000); // Max 30s
                await sleep(waitTime);
            }
        }
    }
    throw lastError;
};

// Parse error response
const parseError = async (response) => {
    try {
        const data = await response.json();
        return data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
        return `HTTP ${response.status}: ${response.statusText}`;
    }
};

// Enhanced API client with cancellation support
export class APIClient {
    constructor() {
        this.abortControllers = new Map();
    }

    // Create abort controller for a request
    createAbortController(requestId) {
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);
        return controller;
    }

    // Cancel a request
    cancelRequest(requestId) {
        const controller = this.abortControllers.get(requestId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(requestId);
        }
    }

    // Cancel all requests
    cancelAllRequests() {
        this.abortControllers.forEach((controller) => controller.abort());
        this.abortControllers.clear();
    }

    // Make request with all enhancements
    async request(url, options = {}, config = {}) {
        const {
            timeout = DEFAULT_TIMEOUT,
            retries = DEFAULT_RETRY_ATTEMPTS,
            retryDelay = DEFAULT_RETRY_DELAY,
            requestId = null,
            onProgress = null,
            useCache = false,
            cacheTTL = 5 * 60 * 1000, // 5 minutes default
            queueWhenOffline = false, // Queue request when offline
        } = config;

        // Check cache for GET requests if caching is enabled
        if (useCache && (!options.method || options.method === 'GET')) {
            const cached = getCached(url, options);
            if (cached !== null) {
                return cached;
            }
        }

        const controller = requestId ? this.createAbortController(requestId) : new AbortController();

        const makeRequest = async () => {
            // Check if offline and queue is enabled
            if (!navigator.onLine && queueWhenOffline) {
                return new Promise((resolve, reject) => {
                    const queueId = offlineQueue.enqueue(async () => {
                        try {
                            const result = await this.request(url, options, { ...config, queueWhenOffline: false });
                            resolve(result);
                            return result;
                        } catch (error) {
                            reject(error);
                            throw error;
                        }
                    });
                    // Return a promise that will resolve when the queue processes
                    // For now, we'll reject immediately and let the queue handle it
                    reject(new NetworkError('Request queued for when connection is restored'));
                });
            }

            try {
                const response = await fetchWithTimeout(
                    url,
                    {
                        ...options,
                        signal: controller.signal,
                    },
                    timeout
                );

                if (!response.ok) {
                    const errorMessage = await parseError(response);
                    // Include headers for rate limit handling
                    const headers = {};
                    response.headers.forEach((value, key) => {
                        headers[key.toLowerCase()] = value;
                    });
                    throw new APIError(errorMessage, response.status, { headers });
                }

                // Handle progress for blob responses
                if (onProgress && response.body) {
                    const reader = response.body.getReader();
                    const contentLength = +response.headers.get("Content-Length");
                    let receivedLength = 0;
                    const chunks = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunks.push(value);
                        receivedLength += value.length;

                        if (contentLength && onProgress) {
                            onProgress((receivedLength / contentLength) * 100);
                        }
                    }

                    const blob = new Blob(chunks);
                    if (requestId) this.abortControllers.delete(requestId);
                    return blob;
                }

                // Handle JSON responses
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    // Cache successful GET responses
                    if (useCache && (!options.method || options.method === 'GET')) {
                        setCached(url, data, options, cacheTTL);
                    }
                    if (requestId) this.abortControllers.delete(requestId);
                    return data;
                }

                // Default to blob
                const blob = await response.blob();
                // Cache successful GET responses (for audio/video)
                if (useCache && (!options.method || options.method === 'GET')) {
                    setCached(url, blob, options, cacheTTL);
                }
                if (requestId) this.abortControllers.delete(requestId);
                return blob;
            } catch (error) {
                if (requestId) this.abortControllers.delete(requestId);
                throw error;
            }
        };

        return withRetry(makeRequest, retries, retryDelay);
    }
}

// Create singleton instance
const apiClient = new APIClient();

// Export apiClient for use in other modules
export { apiClient };

// Export API functions with enhanced error handling
export const getVoices = async () => {
    try {
        return await apiClient.request(`${API_BASE_URL}/voices`, {
            method: "GET",
        }, {
            useCache: true,
            cacheTTL: 60 * 60 * 1000, // Cache voices for 1 hour (they rarely change)
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch voices");
    }
};

// Statistics API functions
export const getDailyStats = async (date = null) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        let url = `${API_BASE_URL}/stats/daily`;
        if (date) {
            url += `?date=${date}`;
        }
        return await apiClient.request(url, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch daily statistics");
    }
};

export const getWeeklyStats = async (endDate = null) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        let url = `${API_BASE_URL}/stats/weekly`;
        if (endDate) {
            url += `?end_date=${endDate}`;
        }
        return await apiClient.request(url, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch weekly statistics");
    }
};

export const getMonthlyStats = async (month = null, year = null) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        let url = `${API_BASE_URL}/stats/monthly`;
        const params = [];
        if (month !== null) params.push(`month=${month}`);
        if (year !== null) params.push(`year=${year}`);
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        return await apiClient.request(url, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch monthly statistics");
    }
};

export const getStreak = async () => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        return await apiClient.request(`${API_BASE_URL}/stats/streak`, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch streak");
    }
};

export const getStatsSummary = async () => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        return await apiClient.request(`${API_BASE_URL}/stats/summary`, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch statistics summary");
    }
};

// Goals API functions
export const getGoals = async (activeOnly = true) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        return await apiClient.request(`${API_BASE_URL}/goals?active_only=${activeOnly}`, {
            method: "GET",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to fetch goals");
    }
};

export const createGoal = async (goalType, targetValue, period = "daily") => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        return await apiClient.request(`${API_BASE_URL}/goals`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                goal_type: goalType,
                target_value: targetValue,
                period: period
            }),
        });
    } catch (error) {
        throw new Error(error.message || "Failed to create goal");
    }
};

export const updateGoal = async (goalId, targetValue = null, isActive = null) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        const body = {};
        if (targetValue !== null) body.target_value = targetValue;
        if (isActive !== null) body.is_active = isActive;
        
        return await apiClient.request(`${API_BASE_URL}/goals/${goalId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        throw new Error(error.message || "Failed to update goal");
    }
};

export const deleteGoal = async (goalId) => {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
        return await apiClient.request(`${API_BASE_URL}/goals/${goalId}`, {
            method: "DELETE",
        });
    } catch (error) {
        throw new Error(error.message || "Failed to delete goal");
    }
};

export const generateSpeech = async (text, voice, speed, config = {}) => {
    const { onProgress, requestId, timeout = 60000 } = config;
    try {
        return await apiClient.request(
            `${API_BASE_URL}/tts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text, voice, speed }),
            },
            {
                timeout,
                retries: 3, // Retry on rate limits
                onProgress,
                requestId,
            }
        );
    } catch (error) {
        if (error instanceof APIError && error.status === 429) {
            const retryAfter = error.data?.headers?.['retry-after'];
            if (retryAfter) {
                throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
            }
            throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error instanceof TimeoutError) {
            throw new Error("Speech generation timed out. Please try again.");
        }
        if (error instanceof NetworkError) {
            throw new Error("Network error. Please check your connection.");
        }
        throw new Error(error.message || "Failed to generate speech");
    }
};

// Writings API functions
export const getWritings = async (
    skip = 0, 
    limit = 100, 
    search = null, 
    category = null, 
    genre = null,
    author = null,
    startDate = null,
    endDate = null,
    minWordCount = null,
    maxWordCount = null
) => {
    try {
        const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        if (search) {
            params.append("search", search);
        }
        if (category) {
            params.append("category", category);
        }
        if (genre) {
            params.append("genre", genre);
        }
        if (author) {
            params.append("author", author);
        }
        if (startDate) {
            params.append("start_date", startDate);
        }
        if (endDate) {
            params.append("end_date", endDate);
        }
        if (minWordCount !== null && minWordCount !== undefined) {
            params.append("min_word_count", minWordCount.toString());
        }
        if (maxWordCount !== null && maxWordCount !== undefined) {
            params.append("max_word_count", maxWordCount.toString());
        }
        return await apiClient.request(`${API_BASE_URL}/writings?${params.toString()}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch writings");
    }
};

export const getCuratedWritings = async (skip = 0, limit = 100, genre = null) => {
    try {
        const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        if (genre) {
            params.append("genre", genre);
        }
        return await apiClient.request(`${API_BASE_URL}/writings/curated?${params.toString()}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch curated writings");
    }
};

export const getGenres = async (category = null) => {
    try {
        const params = new URLSearchParams();
        if (category) {
            params.append("category", category);
        }
        return await apiClient.request(`${API_BASE_URL}/writings/genres?${params.toString()}`, {
            method: "GET",
        }, {
            useCache: true,
            cacheTTL: 30 * 60 * 1000, // Cache genres for 30 minutes
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch genres");
    }
};

export const getWriting = async (writingId) => {
    try {
        return await apiClient.request(`${API_BASE_URL}/writings/${writingId}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch writing");
    }
};

export const createWriting = async (writing) => {
    try {
        const result = await apiClient.request(
            `${API_BASE_URL}/writings`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(writing),
            }
        );
        // Invalidate writings cache when creating new writing
        invalidateCache('/writings');
        return result;
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to create writing");
    }
};

export const updateWriting = async (writingId, writing) => {
    try {
        const result = await apiClient.request(
            `${API_BASE_URL}/writings/${writingId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(writing),
            }
        );
        // Invalidate writings cache when updating
        invalidateCache('/writings');
        return result;
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to update writing");
    }
};

export const deleteWriting = async (writingId) => {
    try {
        const result = await apiClient.request(`${API_BASE_URL}/writings/${writingId}`, {
            method: "DELETE",
        });
        // Invalidate writings cache when deleting
        invalidateCache('/writings');
        return result;
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to delete writing");
    }
};

// Speeches API functions
export const getSpeeches = async (skip = 0, limit = 100, search = null) => {
    try {
        const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        if (search) {
            params.append("search", search);
        }
        return await apiClient.request(`${API_BASE_URL}/speeches?${params.toString()}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch speeches");
    }
};

export const getSpeech = async (speechId) => {
    try {
        return await apiClient.request(`${API_BASE_URL}/speeches/${speechId}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch speech");
    }
};

export const createSpeech = async (topic, config = {}) => {
    const { onProgress, requestId, timeout = 300000 } = config; // 5 minutes timeout for generation
    try {
        return await apiClient.request(
            `${API_BASE_URL}/speeches`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic }),
            },
            {
                timeout,
                retries: 1, // Don't retry speech generation - it's expensive
                onProgress,
                requestId,
            }
        );
    } catch (error) {
        if (error instanceof APIError && error.status === 429) {
            const retryAfter = error.data?.headers?.['retry-after'];
            if (retryAfter) {
                throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
            }
            throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error instanceof TimeoutError) {
            throw new Error("Speech generation timed out. This may take several minutes. Please try again.");
        }
        if (error instanceof NetworkError) {
            throw new Error("Network error. Please check your connection.");
        }
        throw new Error(error.message || "Failed to generate speech");
    }
};

export const deleteSpeech = async (speechId) => {
    try {
        return await apiClient.request(`${API_BASE_URL}/speeches/${speechId}`, {
            method: "DELETE",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to delete speech");
    }
};

// Poetry API functions
export const getPoetryStyles = async () => {
    try {
        return await apiClient.request(`${API_BASE_URL}/poetry/styles`, {
            method: "GET",
        }, {
            useCache: true,
            cacheTTL: 60 * 60 * 1000, // Cache poetry styles for 1 hour
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to get poetry styles");
    }
};

export const getPoems = async (skip = 0, limit = 100, search = null) => {
    try {
        const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
        if (search) {
            params.append('search', search);
        }
        return await apiClient.request(`${API_BASE_URL}/poems?${params.toString()}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to get poems");
    }
};

export const getPoem = async (poemId) => {
    try {
        return await apiClient.request(`${API_BASE_URL}/poems/${poemId}`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to get poem");
    }
};

export const createPoem = async (poem) => {
    try {
        return await apiClient.request(
            `${API_BASE_URL}/poems`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(poem),
            }
        );
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to create poem");
    }
};

export const updatePoem = async (poemId, poem) => {
    try {
        return await apiClient.request(
            `${API_BASE_URL}/poems/${poemId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(poem),
            }
        );
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to update poem");
    }
};

export const deletePoem = async (poemId) => {
    try {
        return await apiClient.request(`${API_BASE_URL}/poems/${poemId}`, {
            method: "DELETE",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to delete poem");
    }
};

// Interactive Conversation API functions
export const startInteractiveConversation = async (topic, voice = 'af_bella', speed = 1.0) => {
    try {
        return await apiClient.request(
            `${API_BASE_URL}/conversation/interactive/start`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic, voice, speed }),
            }
        );
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to start conversation");
    }
};

export const continueInteractiveConversation = async (topic, userMessage, conversationHistory, voice = 'af_bella', speed = 1.0) => {
    try {
        return await apiClient.request(
            `${API_BASE_URL}/conversation/interactive/continue`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic,
                    user_message: userMessage,
                    conversation_history: conversationHistory,
                    voice,
                    speed
                }),
            }
        );
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to continue conversation");
    }
};

export const getInteractiveConversationStatus = async () => {
    try {
        return await apiClient.request(`${API_BASE_URL}/conversation/interactive/status`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to check conversation status");
    }
};

// Export cancellation functions
export const cancelRequest = (requestId) => apiClient.cancelRequest(requestId);
export const cancelAllRequests = () => apiClient.cancelAllRequests();
