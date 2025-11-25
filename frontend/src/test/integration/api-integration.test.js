import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVoices, generateSpeech, generateAvatar, createWriting, updateWriting, deleteWriting, getWritings } from '../../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getVoices', () => {
    it('fetches voices successfully', async () => {
      const mockVoices = { voices: ['af_bella', 'af_sarah', 'am_michael'] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoices,
      });

      const result = await getVoices();
      expect(result).toEqual(mockVoices);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/voices'),
        expect.any(Object)
      );
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getVoices()).rejects.toThrow();
    });

    it('handles non-ok responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      });

      await expect(getVoices()).rejects.toThrow();
    });
  });

  describe('generateSpeech', () => {
    it('generates speech successfully', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await generateSpeech('Hello world', 'af_bella', 1.0);
      expect(result).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tts'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Hello world',
            voice: 'af_bella',
            speed: 1.0,
          }),
        })
      );
    });

    it('handles generation errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Invalid text' }),
      });

      await expect(generateSpeech('', 'af_bella', 1.0)).rejects.toThrow();
    });
  });

  describe('generateAvatar', () => {
    it('generates avatar successfully', async () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });
      const mockFile = new File(['image'], 'test.png', { type: 'image/png' });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await generateAvatar('Hello', mockFile, 'af_bella', 1.0);
      expect(result).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/avatar'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('createWriting', () => {
    it('creates writing successfully', async () => {
      const writingData = {
        title: 'Test Writing',
        content: 'Test content',
        author: 'Test Author',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...writingData }),
      });

      const result = await createWriting(writingData);
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test Writing');
    });
  });

  describe('updateWriting', () => {
    it('updates writing successfully', async () => {
      const writingData = {
        id: 1,
        title: 'Updated Title',
        content: 'Updated content',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => writingData,
      });

      const result = await updateWriting(1, writingData);
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('deleteWriting', () => {
    it('deletes writing successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deleteWriting(1);
      expect(result.success).toBe(true);
    });
  });

  describe('getWritings', () => {
    it('fetches writings successfully', async () => {
      const mockWritings = {
        writings: [
          { id: 1, title: 'Writing 1' },
          { id: 2, title: 'Writing 2' },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWritings,
      });

      const result = await getWritings();
      expect(result.writings).toHaveLength(2);
    });

    it('handles search query', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ writings: [] }),
      });

      await getWritings({ search: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      );
    });
  });
});

