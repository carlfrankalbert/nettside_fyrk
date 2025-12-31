/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import type { OKRReviewResponse, OKRReviewError, OKRReviewResult, OKRStreamEvent } from '../types';
import { hashInput, localStorageCache } from '../utils/cache';
import { ERROR_MESSAGES, API_ROUTES, ANTHROPIC_CONFIG } from '../utils/constants';
import { parseSSEStream, simulateCachedStreaming } from '../utils/streaming';

// In-memory cache for request deduplication
const pendingRequests = new Map<string, Promise<OKRReviewResult>>();

/**
 * Create a fetch request with timeout support
 * Returns an abort controller that can be used to cancel the request
 */
function createFetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): { promise: Promise<Response>; abort: () => void } {
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

      const data = await response.json();

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
        cached: data.cached,
      };
    } catch (err) {
      // Handle timeout specifically
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
 * @param input - The OKR text to review
 * @param onChunk - Callback for each streamed text chunk
 * @param onComplete - Callback when streaming is complete
 * @param onError - Callback for errors
 * @param signal - Optional AbortSignal for cancellation
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
    try {
      // Simulate streaming for cached results (word-by-word for OKR)
      const words = cachedOutput.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) return;
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (signal?.aborted) return;
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
      onComplete();
    } catch {
      // Aborted during cache streaming, ignore
    }
    return;
  }

  try {
    const response = await fetch(API_ROUTES.OKR_REVIEW, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, stream: true }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        onError(ERROR_MESSAGES.RATE_LIMIT);
      } else {
        onError(ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
      }
      return;
    }

    // Use shared streaming parser
    const fullOutput = await parseSSEStream(response, { signal, onChunk });

    // Cache the complete output
    localStorageCache.set(cacheKey, fullOutput);
    onComplete();
  } catch (error) {
    // Don't report errors for intentional cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error('Streaming error:', error);
    // Propagate the error message from the stream if available
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.OKR_REVIEW_DEFAULT;
    onError(errorMessage);
  }
}

// Re-export types for convenience
export type { OKRReviewResponse, OKRReviewError, OKRReviewResult };
