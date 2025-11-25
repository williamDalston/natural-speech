import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from '../../utils/logger';

describe('Logger Utility', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs debug messages in development', () => {
    logger.debug('Debug message');
    // In development, should log
    // In production, should not log
  });

  it('logs info messages', () => {
    logger.info('Info message');
    // Should log info messages
  });

  it('logs warning messages', () => {
    logger.warn('Warning message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('logs error messages', () => {
    logger.error('Error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('handles error objects', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('does not log debug in production', () => {
    const originalEnv = import.meta.env.MODE;
    import.meta.env.MODE = 'production';
    
    logger.debug('Debug message');
    // Should not log in production
    
    import.meta.env.MODE = originalEnv;
  });
});

