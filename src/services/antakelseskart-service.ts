/**
 * Client-side service for interacting with the Antakelseskart API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';
import { isAntakelseskartResponseComplete } from '../utils/response-validator';

const API_ENDPOINT = '/api/antakelseskart';
const CACHE_KEY_PREFIX = 'antakelseskart:v1:';

/**
 * Error messages for the antakelseskart service
 */
const ERROR_MESSAGES = {
  ...DEFAULT_ERROR_MESSAGES,
  INVALID_OUTPUT: 'Jeg fikk ikke gyldige antakelser denne gangen. Prøv igjen.',
} as const;

export { ERROR_MESSAGES };

/**
 * Validate that the output conforms to the expected JSON format.
 */
export function isValidOutput(output: string): boolean {
  return isAntakelseskartResponseComplete(output);
}

// Create the streaming service instance
const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete: isAntakelseskartResponseComplete,
  errorMessages: ERROR_MESSAGES,
  maxRetries: 1,
  retryEventName: 'antakelseskart_retry',
});

/**
 * Generate assumptions with streaming response
 */
export async function generateAssumptionsStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal);
}
