/**
 * Request signing utilities for analytics endpoints
 * Adds basic protection against fake events by requiring a timestamp-based signature
 *
 * Note: This is not cryptographically secure (client-side secret is visible in JS),
 * but it prevents casual abuse and script-based fake events.
 */

/**
 * Signing key - rotated per deployment. Not truly secret, but adds friction.
 * Combined with timestamp validation, this prevents most fake event injection.
 */
const SIGNING_KEY = 'fyrk-2024-analytics';

/**
 * Maximum age of a signed request in milliseconds (5 minutes)
 */
export const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

/**
 * Create a simple hash of a string (same algorithm used elsewhere in codebase)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a signature for a request payload
 * @param timestamp - Unix timestamp in milliseconds
 * @param payload - The request body as a string
 * @returns The signature string
 */
export function createSignature(timestamp: number, payload: string): string {
  const message = `${timestamp}:${payload}:${SIGNING_KEY}`;
  return simpleHash(message);
}

/**
 * Sign a request payload for sending to the server
 * @param payload - The request body object
 * @returns Object with payload, timestamp, and signature
 */
export function signRequest<T extends object>(payload: T): {
  payload: T;
  _ts: number;
  _sig: string;
} {
  const timestamp = Date.now();
  const payloadStr = JSON.stringify(payload);
  const signature = createSignature(timestamp, payloadStr);

  return {
    payload,
    _ts: timestamp,
    _sig: signature,
  };
}

/**
 * Verify a signed request on the server
 * @param body - The request body containing payload, _ts, and _sig
 * @returns Object with isValid flag and extracted payload or error message
 */
export function verifySignedRequest<T>(body: {
  payload?: T;
  _ts?: number;
  _sig?: string;
}): { isValid: true; payload: T } | { isValid: false; error: string } {
  // Check for required fields
  if (!body.payload || !body._ts || !body._sig) {
    return { isValid: false, error: 'Missing signature fields' };
  }

  const { payload, _ts: timestamp, _sig: signature } = body;

  // Check timestamp freshness
  const age = Date.now() - timestamp;
  if (age < 0 || age > MAX_REQUEST_AGE_MS) {
    return { isValid: false, error: 'Request expired or invalid timestamp' };
  }

  // Verify signature
  const payloadStr = JSON.stringify(payload);
  const expectedSignature = createSignature(timestamp, payloadStr);

  if (signature !== expectedSignature) {
    return { isValid: false, error: 'Invalid signature' };
  }

  return { isValid: true, payload };
}
