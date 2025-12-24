/**
 * Page view tracking for analytics
 * Tracks page views and unique visitors automatically on page load
 */

type PageId = 'home' | 'okr' | 'konseptspeil';

/**
 * Track a page view (fire and forget)
 */
function trackPageView(pageId: PageId): void {
  fetch('/api/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId }),
  }).catch(() => {
    // Silently ignore tracking errors
  });
}

/**
 * Initialize page view tracking
 * Call this on page load with the appropriate page ID
 */
export function initPageViewTracking(pageId: PageId): void {
  // Track immediately on page load
  trackPageView(pageId);
}
