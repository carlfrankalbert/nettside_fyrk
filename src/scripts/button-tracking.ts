/**
 * Button click tracking for landing page
 * Attaches event listeners to elements with data-track-button attribute
 * and sends tracking data to the /api/track endpoint
 */

import { shouldExcludeFromTracking } from './tracking-exclusion';
import { signRequest } from '../utils/request-signing';
import { fetchWithRetryFireAndForget } from '../utils/fetch-retry';

/**
 * Track a button click (fire and forget with retry)
 */
function trackClick(buttonId: string): void {
  // Skip tracking for excluded visitors (developer, tests)
  if (shouldExcludeFromTracking()) {
    return;
  }

  const signedRequest = signRequest({ buttonId });

  fetchWithRetryFireAndForget('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedRequest),
  });
}

/**
 * Initialize button tracking
 * Finds all elements with data-track-button attribute and attaches click listeners
 */
export function initButtonTracking(): void {
  const trackedButtons = document.querySelectorAll<HTMLElement>('[data-track-button]');

  trackedButtons.forEach((button) => {
    const buttonId = button.dataset.trackButton;
    if (!buttonId) return;

    button.addEventListener('click', () => {
      trackClick(buttonId);
    });
  });
}
