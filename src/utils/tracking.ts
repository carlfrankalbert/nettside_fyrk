/**
 * Client-side tracking utilities
 * Centralized module for button click tracking and event logging
 */

/**
 * Metadata for check_success events (no PII)
 */
export interface EventMetadata {
  charCount?: number;
  processingTimeMs?: number;
}

/**
 * Track button click (fire and forget)
 * Sends tracking data to the API without blocking the user
 */
export function trackClick(buttonId: string): void {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buttonId }),
  }).catch(() => {
    // Silently ignore tracking errors - tracking should never block the user
  });
}

/**
 * Log an event with optional metadata (fire and forget)
 * Use this for funnel events that may carry additional data
 *
 * @param eventType - Event identifier (e.g., 'check_success', 'feedback_up')
 * @param metadata - Optional metadata (charCount, processingTimeMs) - NO PII
 */
export function logEvent(eventType: string, metadata?: EventMetadata): void {
  const payload: { buttonId: string; metadata?: EventMetadata } = { buttonId: eventType };

  if (metadata) {
    payload.metadata = metadata;
  }

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently ignore tracking errors - tracking should never block the user
  });
}
