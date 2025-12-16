/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import type { OKRReviewResponse, OKRReviewError, OKRReviewResult, OKRStreamEvent } from '../types';
import { hashInput, localStorageCache } from '../utils/cache';
import { ERROR_MESSAGES, API_ROUTES } from '../utils/constants';

// In-memory cache for request deduplication
const pendingRequests = new Map<string, Promise<OKRReviewResult>>();

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
      const response = await fetch(API_ROUTES.OKR_REVIEW, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

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
    } catch {
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
  onError: (error: string) => void
): Promise<void> {
  const cacheKey = await hashInput(input);

  // Check localStorage cache first
  const cachedOutput = localStorageCache.get(cacheKey);
  if (cachedOutput) {
    // Simulate streaming for cached results
    const words = cachedOutput.split(' ');
    for (let i = 0; i < words.length; i++) {
      setTimeout(() => {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        if (i === words.length - 1) {
          onComplete();
        }
      }, i * 10); // 10ms delay between words
    }
    return;
  }

  try {
    const response = await fetch(API_ROUTES.OKR_REVIEW, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        onError(ERROR_MESSAGES.RATE_LIMIT);
      } else {
        onError(ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError(ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullOutput = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            // Cache the complete output
            localStorageCache.set(cacheKey, fullOutput);
            onComplete();
            return;
          }

          try {
            const event: OKRStreamEvent = JSON.parse(data);
            if (event.error) {
              onError(event.message || ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
              return;
            }
            if (event.text) {
              fullOutput += event.text;
              onChunk(event.text);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError(ERROR_MESSAGES.OKR_REVIEW_DEFAULT);
  }
}

// Re-export types for convenience
export type { OKRReviewResponse, OKRReviewError, OKRReviewResult };
