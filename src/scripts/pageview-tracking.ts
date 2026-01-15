/**
 * Page view tracking for analytics
 * Tracks page views and unique visitors automatically on page load
 */

import { shouldExcludeFromTracking } from './tracking-exclusion';
import { signRequest } from '../utils/request-signing';
import { fetchWithRetryFireAndForget } from '../utils/fetch-retry';

type PageId = 'home' | 'okr' | 'konseptspeil' | 'antakelseskart' | 'beslutningslogg';

/**
 * Track a page view (fire and forget with retry)
 */
function trackPageView(pageId: PageId): void {
  // Skip tracking for excluded visitors (developer, tests)
  if (shouldExcludeFromTracking()) {
    return;
  }

  const signedRequest = signRequest({ pageId });

  fetchWithRetryFireAndForget('/api/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest),
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
