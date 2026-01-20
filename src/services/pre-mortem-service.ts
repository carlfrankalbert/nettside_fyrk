/**
 * Client-side service for interacting with the Pre-Mortem Brief API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { isPreMortemResponseComplete } from '../utils/response-validator';

const API_ENDPOINT = '/api/pre-mortem';
const CACHE_KEY_PREFIX = 'premortem:v1:';

/**
 * Error messages for the pre-mortem service
 */
const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Kunne ikke generere komplett Pre-Mortem Brief. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

/**
 * Validate that the output conforms to the expected markdown format.
 */
export function isValidOutput(output: string): boolean {
  return isPreMortemResponseComplete(output);
}

// Create the streaming service instance
const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete: isPreMortemResponseComplete,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 1,
  retryEventName: 'premortem_retry',
});

/**
 * Generate Pre-Mortem Brief with streaming response
 */
export async function generatePreMortemStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal);
}
