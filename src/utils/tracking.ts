/**
 * Client-side tracking utilities
 * Centralized module for button click tracking
 */

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
