import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVoices, generateSpeech, generateAvatar } from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVoices', () => {
    it('fetches voices successfully', async () => {
      const mockVoices = { voices: ['af_bella', 'af_sarah'] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoices,
      });

      const result = await getVoices();
      expect(result).toEqual(mockVoices);
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/voices');
    });

    it('throws error when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(getVoices()).rejects.toThrow('Failed to fetch voices');
    });
  });

  describe('generateSpeech', () => {
    it('generates speech successfully', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await generateSpeech('Hello', 'af_bella', 1.0);
      expect(result).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/tts',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: 'Hello', voice: 'af_bella', speed: 1.0 }),
        })
      );
    });

    it('throws error when generation fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Generation failed' }),
      });

      await expect(generateSpeech('Hello', 'af_bella', 1.0)).rejects.toThrow(
        'Generation failed'
      );
    });
  });

  describe('generateAvatar', () => {
    it('generates avatar successfully', async () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });
      const mockFile = new File(['image data'], 'test.png', { type: 'image/png' });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await generateAvatar('Hello', 'af_bella', 1.0, mockFile);
      expect(result).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/avatar',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws error when generation fails', async () => {
      const mockFile = new File(['image data'], 'test.png', { type: 'image/png' });
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Avatar generation failed' }),
      });

      await expect(generateAvatar('Hello', 'af_bella', 1.0, mockFile)).rejects.toThrow(
        'Avatar generation failed'
      );
    });
  });
});

