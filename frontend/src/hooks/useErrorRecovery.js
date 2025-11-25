/**
 * Error Recovery Hook
 * 
 * Provides consistent error handling and recovery functionality across components.
 * Supports retry mechanisms, error state management, and offline queue integration.
 */

import { useState, useCallback } from 'react';
import { APIError, NetworkError, TimeoutError } from '../api';
import offlineQueue from '../utils/offlineQueue';

export const useErrorRecovery = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableOfflineQueue = true,
    priority = 0,
  } = options;

  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
    setRetryCount(0);
  }, []);

  /**
   * Handle an error
   */
  const handleError = useCallback((err, context = {}) => {
    let errorMessage = 'An unexpected error occurred';
    let details = null;

    if (err instanceof NetworkError) {
      errorMessage = 'Network error. Please check your connection.';
      details = {
        type: 'NetworkError',
        message: err.message,
        context,
      };
    } else if (err instanceof TimeoutError) {
      errorMessage = 'Request timed out. Please try again.';
      details = {
        type: 'TimeoutError',
        message: err.message,
        context,
      };
    } else if (err instanceof APIError) {
      errorMessage = err.message || `Server error (${err.status})`;
      details = {
        type: 'APIError',
        status: err.status,
        message: err.message,
        data: err.data,
        context,
      };
    } else if (err instanceof Error) {
      errorMessage = err.message || errorMessage;
      details = {
        type: 'Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        context,
      };
    } else if (typeof err === 'string') {
      errorMessage = err;
      details = {
        type: 'StringError',
        message: err,
        context,
      };
    }

    setError(errorMessage);
    setErrorDetails(details);
  }, []);

  /**
   * Retry a failed operation
   */
  const retry = useCallback(async (operation, operationContext = {}) => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 30000)));

      const result = await operation();
      
      // Success - clear error state
      clearError();
      setIsRetrying(false);
      
      return result;
    } catch (err) {
      setIsRetrying(false);
      
      if (retryCount < maxRetries - 1) {
        // Still have retries left - update error but don't clear
        handleError(err, operationContext);
        throw err; // Re-throw to allow caller to handle
      } else {
        // Max retries reached
        handleError(err, {
          ...operationContext,
          maxRetriesReached: true,
          retryCount: retryCount + 1,
        });
        throw err;
      }
    }
  }, [isRetrying, retryCount, maxRetries, retryDelay, clearError, handleError]);

  /**
   * Execute an operation with automatic error handling and retry
   */
  const executeWithRecovery = useCallback(async (operation, operationContext = {}) => {
    clearError();

    try {
      const result = await operation();
      return result;
    } catch (err) {
      // Check if we're offline and should queue
      if (enableOfflineQueue && !navigator.onLine && err instanceof NetworkError) {
        // Extract request details from error context if available
        const { url, options, config } = operationContext;
        if (url) {
          const queueId = offlineQueue.enqueue(url, options || {}, config || {}, priority);
          handleError(new Error('You are offline. This request will be processed when you reconnect.'), {
            ...operationContext,
            queued: true,
            queueId,
          });
          return null; // Return null to indicate queued
        }
      }

      handleError(err, operationContext);
      throw err;
    }
  }, [clearError, handleError, enableOfflineQueue, priority]);

  /**
   * Check if error is recoverable
   */
  const isRecoverable = useCallback((err) => {
    if (err instanceof NetworkError) return true;
    if (err instanceof TimeoutError) return true;
    if (err instanceof APIError) {
      // Retry on 5xx errors, rate limits, and some 4xx errors
      return err.status >= 500 || err.status === 429 || err.status === 408;
    }
    return false;
  }, []);

  return {
    error,
    errorDetails,
    isRetrying,
    retryCount,
    clearError,
    handleError,
    retry,
    executeWithRecovery,
    isRecoverable,
  };
};

export default useErrorRecovery;

