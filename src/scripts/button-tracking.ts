/**
 * Button click tracking for landing page
 * Attaches event listeners to elements with data-track-button attribute
 * and sends tracking data to the /api/track endpoint
 */

import { shouldExcludeFromTracking } from './tracking-exclusion';

/**
 * Track a button click (fire and forget)
 */
function trackClick(buttonId: string): void {
  // Skip tracking for excluded visitors (developer, tests)
  if (shouldExcludeFromTracking()) {
    return;
  }

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buttonId }),
  }).catch(() => {
    // Silently ignore tracking errors
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
