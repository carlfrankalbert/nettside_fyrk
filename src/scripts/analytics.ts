/**
 * Site-wide analytics, loaded once per page by the Telemetry component.
 *
 * - Page views: sent when the page renders a <PageView> marker
 * - Clicks: any element with data-track-button, via one delegated listener,
 *   so it also covers the shared header and React-rendered elements
 * - Console helpers: fyrk.excludeFromStats() / includeInStats() / isExcluded()
 *
 * Cookieless: nothing is written to the visitor's device.
 */

import { initPageViewTracking, type PageId } from './pageview-tracking';
import { initTrackingHelpers } from './tracking-exclusion';
import { trackClick } from '../utils/tracking';

/** Session ID written by earlier versions; removed so it doesn't linger */
const LEGACY_SESSION_KEY = 'fyrk_session';

function initClickTracking(): void {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const buttonId = target?.closest<HTMLElement>('[data-track-button]')?.dataset.trackButton;
    if (buttonId) trackClick(buttonId);
  });
}

function sendPageView(): void {
  const marker = document.querySelector<HTMLElement>('[data-pageview]');
  if (!marker) return;
  initPageViewTracking(marker.dataset.pageview as PageId, marker.dataset.article || undefined);
}

function removeLegacySession(): void {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // Storage unavailable (private mode) — nothing to clean up
  }
}

initTrackingHelpers();
initClickTracking();
sendPageView();
removeLegacySession();
