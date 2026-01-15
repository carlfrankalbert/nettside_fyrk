/**
 * Unit tests for Konseptspeil service
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { speileKonsept, speileKonseptStreaming, isValidOutput, ERROR_MESSAGES } from './konseptspeil-service';

// Mock crypto.subtle for hashing
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
vi.stubGlobal('crypto', {
  subtle: {
    digest: mockDigest,
  },
});

// Valid JSON response for tests
const VALID_JSON_RESPONSE = JSON.stringify({
  refleksjon_status: {
    kommentar: 'Du har beskrevet løsningen detaljert.',
    antagelser_funnet: 3
  },
  fokus_sporsmal: {
    overskrift: 'HVIS DU VIL UTFORSKE ÉN TING VIDERE',
    sporsmal: 'Hvem er den primære brukeren?',
    hvorfor: 'Problemet er nevnt, men ikke konkretisert.'
  },
  dimensjoner: {
    verdi: { status: 'antatt', observasjon: 'Test' },
    brukbarhet: { status: 'ikke_nevnt', observasjon: 'Test' },
    gjennomforbarhet: { status: 'beskrevet', observasjon: 'Test' },
    levedyktighet: { status: 'antatt', observasjon: 'Test' }
  },
  antagelser_liste: ['Antagelse 1', 'Antagelse 2']
});

describe('konseptspeil-service', () => {
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

  describe('isValidOutput', () => {
    it('should return true for valid JSON with all required fields', () => {
      expect(isValidOutput(VALID_JSON_RESPONSE)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidOutput('')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidOutput('not valid json')).toBe(false);
    });

    it('should return false for JSON missing required fields', () => {
      const incomplete = JSON.stringify({
        refleksjon_status: { kommentar: 'Test' }
        // Missing fokus_sporsmal and dimensjoner
      });
      expect(isValidOutput(incomplete)).toBe(false);
    });

    it('should extract JSON from markdown code blocks', () => {
      const wrapped = `Here is the response:\n\`\`\`json\n${VALID_JSON_RESPONSE}\n\`\`\``;
      expect(isValidOutput(wrapped)).toBe(true);
    });

    it('should return false if dimensjoner.verdi is missing', () => {
      const missingVerdi = JSON.stringify({
        refleksjon_status: { kommentar: 'Test', antagelser_funnet: 0 },
        fokus_sporsmal: { sporsmal: 'Test?' },
        dimensjoner: {
          brukbarhet: { status: 'antatt', observasjon: 'Test' }
        }
      });
      expect(isValidOutput(missingVerdi)).toBe(false);
    });

    it('should return false if fokus_sporsmal.sporsmal is missing', () => {
      const missingSporsmal = JSON.stringify({
        refleksjon_status: { kommentar: 'Test', antagelser_funnet: 0 },
        fokus_sporsmal: { overskrift: 'Test' },
        dimensjoner: {
          verdi: { status: 'antatt', observasjon: 'Test' },
          brukbarhet: { status: 'antatt', observasjon: 'Test' }
        }
      });
      expect(isValidOutput(missingSporsmal)).toBe(false);
    });
  });

  describe('speileKonsept', () => {
    it('should return cached result from localStorage', async () => {
      // localStorageCache uses 'okr_cache_' prefix and stores JSON with output and timestamp
      const cacheEntry = JSON.stringify({ output: VALID_JSON_RESPONSE, timestamp: Date.now() });
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] = cacheEntry;

      const result = await speileKonsept('Test input');

      expect(result.output).toBe(VALID_JSON_RESPONSE);
      expect(result.cached).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should fetch from API when no cache exists', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: VALID_JSON_RESPONSE, cached: false }),
      });

      const result = await speileKonsept('Test input');

      expect(result.output).toBe(VALID_JSON_RESPONSE);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/konseptspeilet',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: 'Test input', stream: false }),
        })
      );
    });

    it('should handle rate limit (429) error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      });

      await expect(speileKonsept('Test input')).rejects.toThrow(ERROR_MESSAGES.RATE_LIMIT);
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(speileKonsept('Test input')).rejects.toThrow(ERROR_MESSAGES.DEFAULT);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      await expect(speileKonsept('Test input')).rejects.toThrow('Network error');
    });

    it('should cache successful API response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ output: VALID_JSON_RESPONSE, cached: false }),
      });

      await speileKonsept('Test input');

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should return empty string when output is missing', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cached: false }),
      });

      const result = await speileKonsept('Test input');

      expect(result.output).toBe('');
    });
  });

  describe('speileKonseptStreaming', () => {
    it('should stream cached result when available', async () => {
      // localStorageCache uses 'okr_cache_' prefix and stores JSON with output and timestamp
      const cacheEntry = JSON.stringify({ output: VALID_JSON_RESPONSE, timestamp: Date.now() });
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] = cacheEntry;

      const chunks: string[] = [];
      const onChunk = vi.fn((text: string) => chunks.push(text));
      const onComplete = vi.fn();
      const onError = vi.fn();

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      // Wait for setTimeout callbacks
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(onChunk).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
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

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(ERROR_MESSAGES.RATE_LIMIT);
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

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      // Uses the error message from the response
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

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(ERROR_MESSAGES.DEFAULT);
    });

    it('should process SSE stream correctly', async () => {
      // Return a complete JSON response that passes isResponseComplete validation
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(`data: ${JSON.stringify({ text: VALID_JSON_RESPONSE })}\n\n`),
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

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      expect(onChunk).toHaveBeenCalledWith(VALID_JSON_RESPONSE);
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      fetchMock.mockRejectedValue(new Error('Stream error'));

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

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

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('API error');
    });

    it('should clear incomplete cached results', async () => {
      const incompleteResponse = JSON.stringify({ refleksjon_status: { kommentar: 'Incomplete' } });
      // localStorageCache uses 'okr_cache_' prefix and stores JSON with output and timestamp
      const cacheEntry = JSON.stringify({ output: incompleteResponse, timestamp: Date.now() });
      localStorageMock['okr_cache_0000000000000000000000000000000000000000000000000000000000000000'] = cacheEntry;

      // Mock will complete the streaming with valid response
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(`data: ${JSON.stringify({ text: VALID_JSON_RESPONSE })}\n\n`),
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

      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      await speileKonseptStreaming('Test input', onChunk, onComplete, onError);

      // Should have removed the incomplete cached result
      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });
});
