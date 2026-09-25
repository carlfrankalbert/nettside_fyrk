/**
 * Client-side event tracking.
 *
 * Cookieless: nothing is stored on the visitor's device. The server counts
 * unique visitors with a daily-salted hash (see utils/visitor-hash).
 */

import { signRequest } from './request-signing';
import { fetchWithRetryFireAndForget } from './fetch-retry';
import { shouldExcludeFromTracking } from '../scripts/tracking-exclusion';
import type { EventMetadata } from './analytics-metrics';

function sendEvent(buttonId: string, metadata?: EventMetadata): void {
  if (shouldExcludeFromTracking()) return;

  const signedRequest = signRequest(metadata ? { buttonId, metadata } : { buttonId });

  fetchWithRetryFireAndForget('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest),
    // Clicks on links navigate away; keepalive stops the browser cancelling the request
    keepalive: true,
  });
}

/**
 * Track a click (fire and forget with retry)
 */
export function trackClick(buttonId: string): void {
  sendEvent(buttonId);
}

/**
 * Log a funnel event with optional metadata (fire and forget with retry)
 *
 * @param eventType - Event identifier (e.g., 'okr_success', 'okr_error')
 * @param metadata - charCount, processingTimeMs, errorType, cached - NO PII
 */
export function logEvent(eventType: string, metadata?: EventMetadata): void {
  sendEvent(eventType, metadata);
}
