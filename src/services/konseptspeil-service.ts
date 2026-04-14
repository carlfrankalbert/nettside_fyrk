/**
 * Client-side service for interacting with the Konseptspeil API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { isKonseptspeilResponseComplete } from '../utils/response-validator';

// ============================================================================
// Constants
// ============================================================================

const API_ENDPOINT = '/api/konseptspeilet';
const CACHE_KEY_PREFIX = 'konseptspeil:v2:';

const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Jeg fikk ikke et tydelig speil denne gangen. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate that the output conforms to the expected JSON format.
 */
export function isValidOutput(output: string): boolean {
  return isKonseptspeilResponseComplete(output);
}

// ============================================================================
// Service instance
// ============================================================================

const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete: isKonseptspeilResponseComplete,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 1,
  retryEventName: 'konseptspeil_retry',
});

// ============================================================================
// Service functions
// ============================================================================

/**
 * Speile konsept with streaming response
 * @param onRetry - Optional callback called before retry to reset accumulated state
 */
export async function speileKonseptStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
  onRetry?: () => void
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal, onRetry);
}

