/**
 * Site-wide analytics, loaded once per page by the Telemetry component.
 *
 * - Page views: sent when the page renders a <PageView> marker and has been
 *   visible for a few seconds, so crawlers that load a page and leave aren't
 *   counted. The 404 page sends at once (it redirects) with the requested path,
 *   to find broken links
 * - Clicks: any element with data-track-button, via one delegated listener,
 *   so it also covers the shared header and React-rendered elements
 * - Console helpers: fyrk.excludeFromStats() / includeInStats() / isExcluded()
 *
 * Cookieless: nothing is written to the visitor's device.
 */

import { initPageViewTracking, type PageId } from './pageview-tracking';
import { initTrackingHelpers } from './tracking-exclusion';
import { trackClick } from '../utils/tracking';
import { whenVisibleFor } from './visible-dwell';

/** How long a page must be visible before its view counts */
const MIN_VISIBLE_MS = 5000;

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
  const pageId = marker.dataset.pageview as PageId;

  if (pageId === 'notfound') {
    initPageViewTracking(pageId, { path: location.pathname });
    return;
  }

  whenVisibleFor(MIN_VISIBLE_MS, () => {
    initPageViewTracking(pageId, { articleSlug: marker.dataset.article });
  });
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
