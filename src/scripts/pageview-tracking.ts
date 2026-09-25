/**
 * Page view tracking for analytics
 * Tracks page views, unique visitors, referrers, and UTM parameters
 */

import { shouldExcludeFromTracking } from './tracking-exclusion';
import { signRequest } from '../utils/request-signing';
import { fetchWithRetryFireAndForget } from '../utils/fetch-retry';
// Single source of truth: the server's list of tracked pages
import type { PageId } from '../pages/api/pageview';

export type { PageId };

interface PageViewPayload {
  pageId: PageId;
  /** Innsikt article slug — enables per-article view counts. Validated server-side. */
  articleSlug?: string;
  /** Requested path — only sent from the 404 page, to find broken links */
  path?: string;
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
 * Send a page view (fire and forget with retry), with referrer and UTM data.
 * keepalive lets it finish even if the page navigates away (the 404 page redirects).
 */
export function initPageViewTracking(
  pageId: PageId,
  extra: Pick<PageViewPayload, 'articleSlug' | 'path'> = {},
): void {
  if (shouldExcludeFromTracking()) return;

  const payload: PageViewPayload = { pageId };
  if (extra.articleSlug) payload.articleSlug = extra.articleSlug;
  if (extra.path) payload.path = extra.path;

  const referrer = getReferrerDomain();
  if (referrer) payload.referrer = referrer;

  Object.assign(payload, getUtmParams());

  fetchWithRetryFireAndForget('/api/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signRequest(payload)),
    keepalive: true,
  });
}
