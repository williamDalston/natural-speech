/**
 * Centralized logging utility for Prose & Pause
 * 
 * Provides structured logging with different log levels.
 * In production, only errors are logged to console.
 * In development, all logs are shown.
 * 
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.debug('Debug message');
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Debug level logging - only in development
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  debug: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.debug(`[DEBUG] ${message}`, data);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },

  /**
   * Info level logging - only in development
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  info: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.info(`[INFO] ${message}`, data);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  },

  /**
   * Warning level logging - only in development
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  warn: (message, data = null) => {
    if (isDevelopment) {
      if (data) {
        console.warn(`[WARN] ${message}`, data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  },

  /**
   * Error level logging - always logged (even in production)
   * This is the only log level that persists in production for debugging
   * @param {string} message - Error message
   * @param {Error|any} error - Error object or additional data
   * @param {object} context - Additional context information
   */
  error: (message, error = null, context = null) => {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      context,
    };

    // Always log errors, even in production
    if (error) {
      console.error(`[ERROR] ${message}`, logData);
    } else {
      console.error(`[ERROR] ${message}`, context || '');
    }

    // In production, you could send errors to an external logging service
    // Example: sendToLoggingService(logData);
  },
};

export default logger;

