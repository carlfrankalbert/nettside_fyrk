/**
 * Unit tests for OKR service
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { reviewOKR, reviewOKRStreaming } from './okr-service';

// Mock crypto.subtle for hashing
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});

describe('okr-service', () => {
  let fetchMock: Mock;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Reset mocks
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Mock localStorage
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    });

    // Reset digest mock to return consistent hash
    mockDigest.mockResolvedValue(new ArrayBuffer(32));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reviewOKR', () => {
    it('should return cached result from localStorage', async () => {
      const cachedData = {
        output: 'Cached OKR review',
        timestamp: Date.now(),
      };
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] =
        JSON.stringify(cachedData);

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toBe('Cached OKR review');
        expect(result.cached).toBe(true);
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should fetch from API when no cache exists', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'API OKR review', cached: false }),
      });

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toBe('API OKR review');
      }
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/okr-sjekken',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: 'Test OKR' }),
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should handle rate limit (429) error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('For mange forespørsler');
      }
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Noe gikk galt under vurderingen. Prøv igjen om litt.');
      }
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Noe gikk galt under vurderingen. Prøv igjen om litt.');
      }
    });

    it('should handle missing output in response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cached: false }),
      });

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(false);
    });

    it('should cache successful API response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'New OKR review', cached: false }),
      });

      await reviewOKR('Test OKR');

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should not cache when response is already cached', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'Cached OKR review', cached: true }),
      });

      await reviewOKR('Test OKR');

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should expire old cached entries', async () => {
      const oldCachedData = {
        output: 'Old cached review',
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] =
        JSON.stringify(oldCachedData);

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: 'Fresh review', cached: false }),
      });

      const result = await reviewOKR('Test OKR');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output).toBe('Fresh review');
      }
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('reviewOKRStreaming', () => {
    it('should stream cached result when available', async () => {
      const cachedData = {
        output: 'Cached streaming review',
        timestamp: Date.now(),
      };
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] =
        JSON.stringify(cachedData);

      const chunks: string[] = [];
      const onChunk = vi.fn((text: string) => chunks.push(text));
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      // Wait for setTimeout callbacks
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(onChunk).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle rate limit error in streaming mode', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' }),
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('For mange forespørsler. Vent litt før du prøver igjen.');
    });

    it('should handle API errors in streaming mode', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      // Uses shared error message from streaming-service-client
      expect(onError).toHaveBeenCalledWith('Server error');
    });

    it('should handle missing response body', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        body: null,
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Noe gikk galt. Prøv igjen.');
    });

    it('should process SSE stream correctly', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"text":"Hello "}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"text":"World"}\n\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: [DONE]\n\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      fetchMock.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const chunks: string[] = [];
      const onChunk = vi.fn((text: string) => chunks.push(text));
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      expect(onChunk).toHaveBeenCalledWith('Hello ');
      expect(onChunk).toHaveBeenCalledWith('World');
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      fetchMock.mockRejectedValue(new Error('Stream error'));

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      // Error message is passed through from the exception
      expect(onError).toHaveBeenCalledWith('Stream error');
    });

    it('should handle SSE error events', async () => {
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"error":true,"message":"API error"}\n\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      fetchMock.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await reviewOKRStreaming('Test OKR', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('API error');
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });
  });
});
