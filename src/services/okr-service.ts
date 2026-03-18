/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import type { OKRReviewResult } from '../types';
import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { ERROR_MESSAGES as APP_ERROR_MESSAGES, API_ROUTES, CACHE_KEY_PREFIXES } from '../utils/constants';

// ============================================================================
// Constants
// ============================================================================

const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
} as const;

export { ERROR_MESSAGES };

// ============================================================================
// Service instance
// ============================================================================

const service = createStreamingService({
  endpoint: API_ROUTES.OKR_REVIEW,
  cacheKeyPrefix: `${CACHE_KEY_PREFIXES.OKR}:`,
  isResponseComplete: (output) => output.length > 0,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 0,
});

// ============================================================================
// Service functions
// ============================================================================

/**
 * Submit an OKR for AI-powered review with streaming
 */
export async function reviewOKRStreaming(
  input: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
  onRetry?: () => void
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal, onRetry);
}

/**
 * Submit an OKR for AI-powered review (non-streaming)
 * @deprecated Only used in tests. Prefer reviewOKRStreaming for production use.
 */
export async function reviewOKR(input: string): Promise<OKRReviewResult> {
  try {
    const result = await service.request(input);
    if (!result.output) {
      return { success: false, error: APP_ERROR_MESSAGES.OKR_REVIEW_DEFAULT };
    }
    return {
      success: true,
      output: result.output,
      cached: result.cached,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === ERROR_MESSAGES.RATE_LIMIT) {
      return { success: false, error: message };
    }
    return { success: false, error: APP_ERROR_MESSAGES.OKR_REVIEW_DEFAULT };
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { OKRReviewResult };
