/**
 * Client-side service for interacting with the Antakelseskart API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';

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
 * Check if a response has minimal required content
 */
function isResponseComplete(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;

    const parsed = JSON.parse(jsonMatch[0]);

    const hasBeslutning = typeof parsed.beslutning_oppsummert === 'string' &&
      parsed.beslutning_oppsummert.length > 0;
    const hasAntakelser = parsed.antakelser &&
      (Array.isArray(parsed.antakelser.målgruppe_behov) ||
       Array.isArray(parsed.antakelser.løsning_produkt) ||
       Array.isArray(parsed.antakelser.marked_konkurranse) ||
       Array.isArray(parsed.antakelser.forretning_skalering));

    return !!(hasBeslutning && hasAntakelser);
  } catch {
    return false;
  }
}

/**
 * Validate that the output conforms to the expected JSON format.
 */
export function isValidOutput(output: string): boolean {
  return isResponseComplete(output);
}

// Create the streaming service instance
const service = createStreamingService({
  endpoint: API_ENDPOINT,
  cacheKeyPrefix: CACHE_KEY_PREFIX,
  isResponseComplete,
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
