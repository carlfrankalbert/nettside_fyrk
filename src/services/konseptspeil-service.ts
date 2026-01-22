/**
 * Client-side service for interacting with the Konseptspeil API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { isKonseptspeilResponseComplete } from '../utils/response-validator';

const API_ENDPOINT = '/api/konseptspeilet';
const CACHE_KEY_PREFIX = 'konseptspeil:v2:';

/**
 * Error messages for the konseptspeil service
 */
const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Jeg fikk ikke et tydelig speil denne gangen. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

/**
 * Validate that the output conforms to the expected JSON format.
 * Returns true if valid, false if missing required sections.
 */
export function isValidOutput(output: string): boolean {
  return isKonseptspeilResponseComplete(output);
}

// Create the streaming service instance
const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete: isKonseptspeilResponseComplete,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 1,
  retryEventName: 'konseptspeil_retry',
});

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

/**
 * Speile konsept without streaming (for simple use cases)
 */
export async function speileKonsept(input: string): Promise<{ output: string; cached: boolean }> {
  return service.request(input);
}
