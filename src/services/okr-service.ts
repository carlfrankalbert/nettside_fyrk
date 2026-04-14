/**
 * OKR Reviewer Service
 * Handles API communication for OKR analysis with caching and streaming support
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { API_ROUTES, CACHE_KEY_PREFIXES } from '../utils/constants';
import { isValidOKROutput } from '../utils/output-validators';

// ============================================================================
// Constants
// ============================================================================

const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Kunne ikke generere en komplett vurdering. Prøv igjen.',
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

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate that the output conforms to the expected OKR review format.
 */
export function isValidOutput(output: string): boolean {
  return isValidOKROutput(output);
}

