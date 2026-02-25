/**
 * Page view tracking for analytics
 * Tracks page views, unique visitors, referrers, and UTM parameters
 */

import { shouldExcludeFromTracking } from './tracking-exclusion';
import { signRequest } from '../utils/request-signing';
import { fetchWithRetryFireAndForget } from '../utils/fetch-retry';

type PageId = 'home' | 'okr' | 'konseptspeil' | 'antakelseskart' | 'beslutningslogg' | 'premortem';

interface PageViewPayload {
  pageId: PageId;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/** Max length for UTM parameter values */
const MAX_UTM_LENGTH = 200;

/**
 * Extract referrer domain from document.referrer
 * Strips www. prefix and skips internal referrers
 */
function getReferrerDomain(): string | undefined {
  try {
    const ref = document.referrer;
    if (!ref) return undefined;

    const url = new URL(ref);
    // Skip internal referrers
    if (url.hostname === location.hostname) return undefined;

    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Extract UTM parameters from the current URL
 * Captures utm_source, utm_medium, utm_campaign
 */
function getUtmParams(): Pick<PageViewPayload, 'utmSource' | 'utmMedium' | 'utmCampaign'> {
  const params = new URLSearchParams(location.search);
  const result: Pick<PageViewPayload, 'utmSource' | 'utmMedium' | 'utmCampaign'> = {};

  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign');

  if (source) result.utmSource = source.slice(0, MAX_UTM_LENGTH).toLowerCase();
  if (medium) result.utmMedium = medium.slice(0, MAX_UTM_LENGTH).toLowerCase();
  if (campaign) result.utmCampaign = campaign.slice(0, MAX_UTM_LENGTH).toLowerCase();

  return result;
}

/**
 * Track a page view (fire and forget with retry)
 * Includes referrer and UTM data when available
 */
function trackPageView(pageId: PageId): void {
  if (shouldExcludeFromTracking()) return;

  const payload: PageViewPayload = { pageId };

  const referrer = getReferrerDomain();
  if (referrer) payload.referrer = referrer;

  const utm = getUtmParams();
  Object.assign(payload, utm);

  const signedRequest = signRequest(payload);

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
  trackPageView(pageId);
}
