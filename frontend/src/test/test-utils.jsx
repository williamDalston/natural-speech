import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Test utilities for common testing patterns
 */

// Mock API functions
export const mockApi = {
  getVoices: vi.fn().mockResolvedValue({ voices: ['af_bella', 'af_sarah'] }),
  generateSpeech: vi.fn().mockResolvedValue(new Blob(['audio'], { type: 'audio/wav' })),
  generateAvatar: vi.fn().mockResolvedValue(new Blob(['video'], { type: 'video/mp4' })),
  createWriting: vi.fn().mockResolvedValue({ id: 1, title: 'Test', content: 'Test content' }),
  updateWriting: vi.fn().mockResolvedValue({ id: 1, title: 'Updated', content: 'Updated content' }),
  deleteWriting: vi.fn().mockResolvedValue({ success: true }),
  getWritings: vi.fn().mockResolvedValue({ writings: [] }),
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
  };
};

// Mock window.matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
    unobserve() {}
  };
};

// Custom render with providers
export const renderWithProviders = (ui, { ...renderOptions } = {}) => {
  const Wrapper = ({ children }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Create mock audio element
export const createMockAudio = () => {
  const audio = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    currentTime: 0,
    duration: 100,
    volume: 1,
    paused: true,
    ended: false,
  };
  return audio;
};

// Create mock video element
export const createMockVideo = () => {
  const video = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    currentTime: 0,
    duration: 100,
    volume: 1,
    paused: true,
    ended: false,
    requestFullscreen: vi.fn(),
  };
  return video;
};

// Mock file input
export const createMockFile = (name = 'test.png', type = 'image/png', content = 'test') => {
  return new File([content], name, { type });
};

// Mock URL.createObjectURL
export const mockObjectURL = () => {
  const urls = {};
  global.URL.createObjectURL = vi.fn((blob) => {
    const url = `blob:${Math.random()}`;
    urls[url] = blob;
    return url;
  });
  global.URL.revokeObjectURL = vi.fn((url) => {
    delete urls[url];
  });
  return urls;
};

// Helper to test keyboard navigation
export const testKeyboardNavigation = async (user, elements) => {
  for (const element of elements) {
    await user.tab();
    expect(element).toHaveFocus();
  }
};

// Helper to test ARIA attributes
export const testAriaAttributes = (element, expectedAttributes) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value);
  });
};

