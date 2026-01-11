/**
 * Unit tests for fetch retry utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchWithRetry } from './fetch-retry';

describe('fetch-retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('fetchWithRetry', () => {
    it('should return response on successful fetch', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const result = await fetchWithRetry('/api/test');

      expect(result).toBe(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on successful response', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await fetchWithRetry('/api/test');

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 4xx client errors', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      const result = await fetchWithRetry('/api/test');

      expect(result).toBe(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx server errors', async () => {
      const failResponse = new Response('Server Error', { status: 500 });
      const successResponse = new Response(JSON.stringify({ success: true }), { status: 200 });

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      const resultPromise = fetchWithRetry('/api/test', undefined, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      // Advance timers to allow retry
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe(successResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors (TypeError)', async () => {
      const networkError = new TypeError('Failed to fetch');
      const successResponse = new Response(JSON.stringify({ success: true }), { status: 200 });

      vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      const resultPromise = fetchWithRetry('/api/test', undefined, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      // Advance timers to allow retry
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe(successResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return null after all retries exhausted', async () => {
      const failResponse = new Response('Server Error', { status: 500 });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(failResponse);

      const resultPromise = fetchWithRetry('/api/test', undefined, {
        maxRetries: 2,
        initialDelayMs: 100,
      });

      // Advance timers to allow all retries
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should pass init options to fetch', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      };

      await fetchWithRetry('/api/test', init);

      expect(fetch).toHaveBeenCalledWith('/api/test', init);
    });

    it('should respect maxRetries option', async () => {
      const failResponse = new Response('Server Error', { status: 500 });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(failResponse);

      const resultPromise = fetchWithRetry('/api/test', undefined, {
        maxRetries: 1,
        initialDelayMs: 100,
      });

      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });
});
