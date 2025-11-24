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
 * 
 * @module api
 */

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

// Retry wrapper
const withRetry = async (fn, retries = DEFAULT_RETRY_ATTEMPTS, delay = DEFAULT_RETRY_DELAY) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            // Don't retry on client errors (4xx) or timeout errors
            if (error instanceof APIError && error.status >= 400 && error.status < 500) {
                throw error;
            }
            if (error instanceof TimeoutError) {
                throw error;
            }
            // Exponential backoff
            if (i < retries - 1) {
                await sleep(delay * Math.pow(2, i));
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
        } = config;

        const controller = requestId ? this.createAbortController(requestId) : new AbortController();

        const makeRequest = async () => {
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
                    throw new APIError(errorMessage, response.status);
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
                    if (requestId) this.abortControllers.delete(requestId);
                    return data;
                }

                // Default to blob
                const blob = await response.blob();
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

// Export API functions with enhanced error handling
export const getVoices = async () => {
    try {
        return await apiClient.request(`${API_BASE_URL}/voices`, {
            method: "GET",
        });
    } catch (error) {
        if (error instanceof NetworkError) {
            throw new Error("Cannot connect to server. Please ensure the backend is running.");
        }
        throw new Error(error.message || "Failed to fetch voices");
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
                retries: 1, // Don't retry TTS as it's usually fast
                onProgress,
                requestId,
            }
        );
    } catch (error) {
        if (error instanceof TimeoutError) {
            throw new Error("Speech generation timed out. Please try again.");
        }
        if (error instanceof NetworkError) {
            throw new Error("Network error. Please check your connection.");
        }
        throw new Error(error.message || "Failed to generate speech");
    }
};

export const generateAvatar = async (text, voice, speed, imageFile, config = {}) => {
    const { onProgress, requestId, timeout = DEFAULT_TIMEOUT } = config;
    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice", voice);
    formData.append("speed", speed);
    formData.append("image", imageFile);

    try {
        return await apiClient.request(
            `${API_BASE_URL}/avatar`,
            {
                method: "POST",
                body: formData,
            },
            {
                timeout,
                retries: 1, // Don't retry avatar generation (too long)
                onProgress,
                requestId,
            }
        );
    } catch (error) {
        if (error instanceof TimeoutError) {
            throw new Error("Avatar generation timed out. This may take several minutes. Please try again.");
        }
        if (error instanceof NetworkError) {
            throw new Error("Network error. Please check your connection.");
        }
        throw new Error(error.message || "Failed to generate avatar");
    }
};

// Export cancellation functions
export const cancelRequest = (requestId) => apiClient.cancelRequest(requestId);
export const cancelAllRequests = () => apiClient.cancelAllRequests();
