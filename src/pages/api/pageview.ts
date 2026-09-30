import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { shouldExcludeRequest } from '../../utils/tracking-exclusion';
import { verifySignedRequest } from '../../utils/request-signing';
import { hasStatsAccess, STATS_TOKEN_COOKIE } from '../../lib/token-cookie';
import { sanitizeReferrer, sanitizeUtmValue } from '../../utils/acquisition';
import { API_HEADERS, getDateKey, TIME_PERIODS, type TimePeriod } from '../../utils/analytics-helpers';
import { getVisitorHash } from '../../utils/visitor-hash';
import { audienceValues, sanitizeNotFoundPath, type RequestGeo } from '../../utils/visitor-dimensions';
import { recordPageview } from '../../lib/stats-db';
import { loadAcquisition, loadPageviewTimeseries } from '../../lib/stats-data';

export const prerender = false;

/**
 * Valid page IDs for tracking
 */
export const TRACKED_PAGES = {
  home: { label: 'fyrk.no' },
  okr: { label: 'fyrk.no/okr-sjekken' },
  konseptspeil: { label: 'fyrk.no/konseptspeilet' },
  antakelseskart: { label: 'fyrk.no/antakelseskart' },
  beslutningslogg: { label: 'fyrk.no/beslutningslogg' },
  premortem: { label: 'fyrk.no/verktoy/pre-mortem' },
  innsikt: { label: 'fyrk.no/innsikt' },
  verktoy: { label: 'fyrk.no/verktoy' },
  konsulenter: { label: 'fyrk.no/konsulenter' },
  notfound: { label: '404 (siden finnes ikke)' },
} as const;

export type PageId = keyof typeof TRACKED_PAGES;

/**
 * Cache of published Innsikt slugs, used to validate article-level tracking so
 * arbitrary slugs can't create unbounded rows. Lives for the worker's lifetime.
 */
let innsiktSlugCache: Set<string> | null = null;
async function getInnsiktSlugs(): Promise<Set<string>> {
  if (innsiktSlugCache) return innsiktSlugCache;
  const entries = await getCollection('innsikt', ({ data }) => !data.draft);
  innsiktSlugCache = new Set(entries.map(e => e.id));
  return innsiktSlugCache;
}

/**
 * POST /api/pageview
 * Tracks page views and unique visitors.
 * Cookieless: visitors are counted with a daily-salted hash (see utils/visitor-hash).
 *
 * Request body: { pageId, articleSlug?, path? (notfound only), referrer?, utmSource?, utmMedium?, utmCampaign? }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Exclude automated browsers and test traffic
    if (shouldExcludeRequest(request)) {
      return new Response(
        JSON.stringify({ success: true, message: 'Excluded from tracking' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // The visitor hash's daily salt lives in KV; the stats themselves in D1
    const kv = env.ANALYTICS_KV;
    const db = env.STATS_DB;

    if (!kv || !db) {
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Parse and verify signed request
    interface PageViewBody {
      pageId?: string;
      articleSlug?: string;
      /** Requested path, only for pageId 'notfound' */
      path?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    }

    let pageId: PageId = 'home';
    let articleSlug: string | null = null;
    let notFoundPath: string | undefined;
    let acquisitionFields: Omit<PageViewBody, 'pageId' | 'articleSlug'> = {};
    try {
      const rawBody = await request.json() as {
        payload?: PageViewBody;
        _ts?: number;
        _sig?: string;
      };

      // Verify request signature
      const verification = verifySignedRequest<PageViewBody>(rawBody);

      if (!verification.isValid) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request signature' }),
          { status: 400, headers: API_HEADERS }
        );
      }

      const body = verification.payload;
      if (body.pageId && body.pageId in TRACKED_PAGES) {
        pageId = body.pageId as PageId;
      }

      // Per-article tracking only for Innsikt, and only for published slugs.
      if (pageId === 'innsikt' && typeof body.articleSlug === 'string') {
        const validSlugs = await getInnsiktSlugs();
        if (validSlugs.has(body.articleSlug)) {
          articleSlug = body.articleSlug;
        }
      }

      if (pageId === 'notfound' && typeof body.path === 'string') {
        notFoundPath = body.path;
      }

      acquisitionFields = {
        referrer: body.referrer,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      };
    } catch {
      // No body or invalid JSON - use default
    }

    const timestamp = Date.now();
    const visitorHash = await getVisitorHash(request, kv, getDateKey(timestamp));

    const { isNewVisitor } = await recordPageview(db, {
      timestamp,
      pageId,
      visitorHash,
      articleSlug,
      notFoundPath: sanitizeNotFoundPath(notFoundPath),
      acquisition: {
        referrer: sanitizeReferrer(acquisitionFields.referrer),
        source: sanitizeUtmValue(acquisitionFields.utmSource),
        medium: sanitizeUtmValue(acquisitionFields.utmMedium),
        campaign: sanitizeUtmValue(acquisitionFields.utmCampaign),
      },
      audience: audienceValues(
        (request as Request & { cf?: RequestGeo }).cf,
        request.headers.get('user-agent') || '',
      ),
    });

    return new Response(
      JSON.stringify({ success: true, pageId, isNewVisitor }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Page view tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 500, headers: API_HEADERS }
    );
  }
};

/**
 * GET /api/pageview
 * Chart data for the /stats dashboard (needs the stats token).
 *
 * Query params:
 * - pageId: page to get data for
 * - timeseries=true: page views over time
 * - acquisition=true: referrer/UTM counts
 * - period: '24h', 'week', 'month', 'year' or 'all' (default '24h')
 */
export const GET: APIRoute = async ({ url, request, cookies }) => {
  if (!hasStatsAccess(request, cookies.get(STATS_TOKEN_COOKIE.name)?.value, env.STATS_TOKEN)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: API_HEADERS });
  }

  const pageId = url.searchParams.get('pageId');
  const rawPeriod = url.searchParams.get('period') || '24h';
  if (!pageId || !(pageId in TRACKED_PAGES) || !(rawPeriod in TIME_PERIODS)) {
    return new Response(JSON.stringify({ error: 'Unknown pageId or period' }), { status: 400, headers: API_HEADERS });
  }
  const period = rawPeriod as TimePeriod;

  try {
    if (url.searchParams.get('acquisition') === 'true') {
      const acquisition = await loadAcquisition(env.STATS_DB, pageId, period);
      return new Response(JSON.stringify({ pageId, acquisition, period }), { status: 200, headers: API_HEADERS });
    }
    if (url.searchParams.get('timeseries') === 'true') {
      const timeseries = await loadPageviewTimeseries(env.STATS_DB, pageId, period);
      return new Response(JSON.stringify({ pageId, timeseries, period }), { status: 200, headers: API_HEADERS });
    }
    return new Response(JSON.stringify({ error: 'Use timeseries=true or acquisition=true' }), { status: 400, headers: API_HEADERS });
  } catch (error) {
    console.error('Error fetching page view stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), { status: 500, headers: API_HEADERS });
  }
};
