/**
 * Client-side service for interacting with the Konseptspeil API
 * Handles streaming responses, caching, and request validation
 */

import { createStreamingService, DEFAULT_ERROR_MESSAGES } from '../lib/streaming-service-client';

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
 * Check if a response has minimal required content
 * This helps detect truncated or incomplete AI responses
 *
 * For the JSON format, we check that it's valid JSON with required fields
 */
function isResponseComplete(output: string): boolean {
  if (!output || output.trim().length === 0) return false;

  try {
    // Extract JSON from potential markdown code blocks or surrounding text
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;

    const parsed = JSON.parse(jsonMatch[0]);

    // Check for required top-level fields
    const hasRefleksjonStatus = parsed.refleksjon_status?.kommentar;
    const hasFokusSporsmal = parsed.fokus_sporsmal?.sporsmal;
    const hasDimensjoner = parsed.dimensjoner?.verdi && parsed.dimensjoner?.brukbarhet;

    return !!(hasRefleksjonStatus && hasFokusSporsmal && hasDimensjoner);
  } catch {
    return false;
  }
}

/**
 * Validate that the output conforms to the expected JSON format.
 * Returns true if valid, false if missing required sections.
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
  retryEventName: 'konseptspeil_retry',
});

/**
 * Speile konsept with streaming response
 */
export async function speileKonseptStreaming(
  input: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  return service.streamRequest(input, onChunk, onComplete, onError, signal);
}

/**
 * Speile konsept without streaming (for simple use cases)
 */
export async function speileKonsept(input: string): Promise<{ output: string; cached: boolean }> {
  return service.request(input);
}
