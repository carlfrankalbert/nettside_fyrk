/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import type { OKRReviewResponse, OKRReviewError, OKRReviewResult } from '../types';
import { hashInput, localStorageCache } from '../utils/cache';
import { ERROR_MESSAGES, API_ROUTES, ANTHROPIC_CONFIG } from '../utils/constants';
import { performStreamingRequest, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';

// In-memory cache for request deduplication
const pendingRequests = new Map<string, Promise<OKRReviewResult>>();

/**
 * Create a fetch request with timeout support
 */
function createFetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): { promise: Promise<Response>; abort: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const promise = fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  return {
    promise,
    abort: () => {
      clearTimeout(timeoutId);
      controller.abort();
    },
  };
}

/**
 * Submit an OKR for AI-powered review (non-streaming)
 */
export async function reviewOKR(input: string): Promise<OKRReviewResult> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = localStorageCache.get(cacheKey);
  if (cachedOutput) {
    return {
      success: true,
      output: cachedOutput,
      cached: true,
    };
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Create new request promise
  const requestPromise = (async (): Promise<OKRReviewResult> => {
    try {
      const { promise } = createFetchWithTimeout(
        API_ROUTES.OKR_REVIEW,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        },
        ANTHROPIC_CONFIG.REQUEST_TIMEOUT_MS
      );
      const response = await promise;

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: ERROR_MESSAGES.RATE_LIMIT,
          };
        }
        return {
          success: false,
          error: ERROR_MESSAGES.OKR_REVIEW_DEFAULT,
        };
      }

      const data = (await response.json()) as { output?: string; cached?: boolean };

      if (!data.output) {
        return {
          success: false,
          error: ERROR_MESSAGES.OKR_REVIEW_DEFAULT,
        };
      }

      // Cache successful result
      if (!data.cached) {
        localStorageCache.set(cacheKey, data.output);
      }

      return {
        success: true,
        output: data.output,
        cached: data.cached ?? false,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          error: 'Forespørselen tok for lang tid. Prøv igjen.',
        };
      }
      return {
        success: false,
        error: ERROR_MESSAGES.OKR_REVIEW_DEFAULT,
      };
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Submit an OKR for AI-powered review with streaming
 */
export async function reviewOKRStreaming(
  input: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = localStorageCache.get(cacheKey);
  if (cachedOutput) {
    // Simulate streaming for cached results using word-based chunks (OKR-specific UX)
    const words = cachedOutput.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (signal?.aborted) return;
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
    }
    onComplete();
    return;
  }

  try {
    const output = await performStreamingRequest(
      API_ROUTES.OKR_REVIEW,
      input,
      onChunk,
      signal,
      DEFAULT_ERROR_MESSAGES
    );

    // Cache the complete output
    localStorageCache.set(cacheKey, output);
    onComplete();
  } catch (error) {
    // Don't report errors for intentional cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error('Streaming error:', error);
    onError(error instanceof Error ? error.message : ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
  }
}

// Re-export types for convenience
export type { OKRReviewResponse, OKRReviewError, OKRReviewResult };
