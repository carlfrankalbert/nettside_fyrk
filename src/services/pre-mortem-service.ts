/**
 * Client-side service for interacting with the Pre-Mortem Brief API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { isPreMortemResponseComplete } from '../utils/response-validator';
import { API_ROUTES, CACHE_KEY_PREFIXES } from '../utils/constants';

// ============================================================================
// Constants
// ============================================================================

const API_ENDPOINT = API_ROUTES.PRE_MORTEM;
const CACHE_KEY_PREFIX = `${CACHE_KEY_PREFIXES.PRE_MORTEM}:`;

const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Kunne ikke generere komplett Pre-Mortem Brief. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate that the output conforms to the expected markdown format.
 */
export function isValidOutput(output: string): boolean {
  return isPreMortemResponseComplete(output);
}

// ============================================================================
// Service instance
// ============================================================================

const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete: isPreMortemResponseComplete,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 1,
  retryEventName: 'premortem_retry',
});

// ============================================================================
// Service functions
// ============================================================================

/**
 * Generate Pre-Mortem Brief with streaming response
 * @param onRetry - Optional callback called before retry to reset accumulated state
 */
export async function generatePreMortemStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
  onRetry?: () => void
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal, onRetry);
}
