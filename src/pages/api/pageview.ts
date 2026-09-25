import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { shouldExcludeRequest } from '../../utils/tracking-exclusion';
import { verifySignedRequest } from '../../utils/request-signing';
import { hasStatsAccess, STATS_TOKEN_COOKIE } from '../../lib/token-cookie';
import {
  sanitizeReferrer,
  sanitizeUtmValue,
  incrementField,
  emptyAcquisitionData,
  type AcquisitionData,
} from '../../utils/acquisition';
import {
  API_HEADERS,
  getDateKey,
  getHourKey,
  fetchCountTimeseries,
  getVisitorsTimeseriesData,
  getAcquisitionData,
  type TimePeriod,
} from '../../utils/analytics-helpers';
import { ANALYTICS_CONFIG } from '../../utils/constants';
import { getVisitorHash, addToVisitorSet } from '../../utils/visitor-hash';
import { recordAudience, recordNotFound, type RequestGeo } from '../../utils/visitor-dimensions';

export const prerender = false;

/**
 * Valid page IDs for tracking
 */
export const TRACKED_PAGES = {
  home: { key: 'pageviews_home', label: 'fyrk.no' },
  okr: { key: 'pageviews_okr', label: 'fyrk.no/okr-sjekken' },
  konseptspeil: { key: 'pageviews_konseptspeil', label: 'fyrk.no/konseptspeilet' },
  antakelseskart: { key: 'pageviews_antakelseskart', label: 'fyrk.no/antakelseskart' },
  beslutningslogg: { key: 'pageviews_beslutningslogg', label: 'fyrk.no/beslutningslogg' },
  premortem: { key: 'pageviews_premortem', label: 'fyrk.no/verktoy/pre-mortem' },
  innsikt: { key: 'pageviews_innsikt', label: 'fyrk.no/innsikt' },
  verktoy: { key: 'pageviews_verktoy', label: 'fyrk.no/verktoy' },
  konsulenter: { key: 'pageviews_konsulenter', label: 'fyrk.no/konsulenter' },
  notfound: { key: 'pageviews_notfound', label: '404 (siden finnes ikke)' },
} as const;

export type PageId = keyof typeof TRACKED_PAGES;

/**
 * Cache of published Innsikt slugs, used to validate article-level tracking so
 * arbitrary slugs can't create unbounded KV keys. Lives for the worker's lifetime.
 */
let innsiktSlugCache: Set<string> | null = null;
async function getInnsiktSlugs(): Promise<Set<string>> {
  if (innsiktSlugCache) return innsiktSlugCache;
  const entries = await getCollection('innsikt', ({ data }) => !data.draft);
  innsiktSlugCache = new Set(entries.map(e => e.id));
  return innsiktSlugCache;
}

/** KV key prefix for per-article Innsikt metrics. */
const ARTICLE_NS = 'innsikt';

/**
 * Record a single Innsikt article read: total + daily views, and unique visitors
 * (daily set + all-time counter). Mirrors the per-page scheme, namespaced by slug.
 */
async function trackArticleView(
  kv: KVNamespace,
  slug: string,
  dateKey: string,
  visitorHash: string,
): Promise<void> {
  const totalKey = `article_views_total:${ARTICLE_NS}:${slug}`;
  const dailyKey = `article_views_daily:${ARTICLE_NS}:${slug}:${dateKey}`;
  const visitorsKey = `article_visitors:${ARTICLE_NS}:${slug}:${dateKey}`;
  const visitorsTotalKey = `article_visitors_total:${ARTICLE_NS}:${slug}`;

  const total = await kv.get(totalKey);
  await kv.put(totalKey, String((parseInt(total || '0', 10) || 0) + 1));

  const daily = await kv.get(dailyKey);
  await kv.put(dailyKey, String((parseInt(daily || '0', 10) || 0) + 1), {
    expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
  });

  if (await addToVisitorSet(kv, visitorsKey, visitorHash)) {
    const totalVisitors = await kv.get(visitorsTotalKey);
    await kv.put(visitorsTotalKey, String((parseInt(totalVisitors || '0', 10) || 0) + 1));
  }
}

/**
 * Store acquisition data (referrer + UTM) aggregated per page per day
 */
async function storeAcquisitionData(
  kv: KVNamespace,
  pageId: PageId,
  dateKey: string,
  data: { referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string },
): Promise<void> {
  const referrer = sanitizeReferrer(data.referrer);
  const source = sanitizeUtmValue(data.utmSource);
  const medium = sanitizeUtmValue(data.utmMedium);
  const campaign = sanitizeUtmValue(data.utmCampaign);

  // Skip if nothing to store
  if (!referrer && !source && !medium && !campaign) return;

  const key = `acquisition:${pageId}:${dateKey}`;
  const existing = await kv.get(key);

  let acquisition: AcquisitionData;
  try {
    acquisition = existing ? JSON.parse(existing) : emptyAcquisitionData();
  } catch {
    acquisition = emptyAcquisitionData();
  }

  incrementField(acquisition.referrers, referrer);
  incrementField(acquisition.sources, source);
  incrementField(acquisition.mediums, medium);
  incrementField(acquisition.campaigns, campaign);

  await kv.put(key, JSON.stringify(acquisition), {
    expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
  });
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

    const kv = env.ANALYTICS_KV;

    if (!kv) {
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
    const dateKey = getDateKey(timestamp);
    const hourKey = getHourKey(timestamp);

    const visitorHash = await getVisitorHash(request, kv, dateKey);

    // Update total page views (legacy counter)
    const totalKey = TRACKED_PAGES[pageId].key;
    const currentTotal = await kv.get(totalKey);
    const newTotal = (parseInt(currentTotal || '0', 10) || 0) + 1;
    await kv.put(totalKey, String(newTotal));

    // Store hourly page view data
    const hourlyKey = `pageviews:${pageId}:${hourKey}`;
    const hourlyCount = await kv.get(hourlyKey);
    const newHourlyCount = (parseInt(hourlyCount || '0', 10) || 0) + 1;
    await kv.put(hourlyKey, String(newHourlyCount), {
      expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
    });

    // Store daily page view data
    const dailyKey = `pageviews_daily:${pageId}:${dateKey}`;
    const dailyCount = await kv.get(dailyKey);
    const newDailyCount = (parseInt(dailyCount || '0', 10) || 0) + 1;
    await kv.put(dailyKey, String(newDailyCount), {
      expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
    });

    // Unique visitors per day; the all-time counter keeps counting past the set cap
    const isNewVisitor = await addToVisitorSet(kv, `visitors:${pageId}:${dateKey}`, visitorHash);
    if (isNewVisitor) {
      const totalVisitorsKey = `visitors_total:${pageId}`;
      const currentTotalVisitors = await kv.get(totalVisitorsKey);
      await kv.put(totalVisitorsKey, String((parseInt(currentTotalVisitors || '0', 10) || 0) + 1));
    }

    // Country, organisation, device and browser: once per site visitor per day
    if (await addToVisitorSet(kv, `visitors_site:${dateKey}`, visitorHash)) {
      const geo = (request as Request & { cf?: RequestGeo }).cf;
      await recordAudience(kv, dateKey, geo, request.headers.get('user-agent') || '');
    }

    if (notFoundPath) {
      await recordNotFound(kv, dateKey, notFoundPath);
    }

    // Record per-article read when a valid Innsikt slug was provided
    if (articleSlug) {
      await trackArticleView(kv, articleSlug, dateKey, visitorHash);
    }

    // Store acquisition data (referrer + UTM) - non-blocking for the response
    await storeAcquisitionData(kv, pageId, dateKey, acquisitionFields);

    return new Response(
      JSON.stringify({ success: true, pageId, views: newTotal, isNewVisitor }),
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
 * Returns page view and visitor statistics.
 *
 * Query params:
 * - pageId: (optional) specific page to get stats for
 * - all: (optional) if 'true', returns stats for all pages
 * - timeseries: (optional) if 'true', returns time-series data
 * - acquisition: (optional) if 'true', returns referrer/UTM data
 * - period: (optional) time period: '24h', 'week', 'month', 'year', 'all'
 */
export const GET: APIRoute = async ({ url, request, cookies }) => {
  if (!hasStatsAccess(request, cookies.get(STATS_TOKEN_COOKIE.name)?.value, env.STATS_TOKEN)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: API_HEADERS });
  }

  try {
    const kv = env.ANALYTICS_KV;

    if (!kv) {
      return new Response(
        JSON.stringify({ stats: null, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    const pageId = url.searchParams.get('pageId') as PageId | null;
    const getAll = url.searchParams.get('all') === 'true';
    const getTimeseries = url.searchParams.get('timeseries') === 'true';
    const getAcquisition = url.searchParams.get('acquisition') === 'true';
    const period = (url.searchParams.get('period') || '24h') as TimePeriod;

    // Get acquisition data (referrer + UTM) for a specific page
    if (getAcquisition && pageId && pageId in TRACKED_PAGES) {
      const acquisition = await getAcquisitionData(kv, pageId, period);
      return new Response(
        JSON.stringify({ pageId, acquisition, period }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Get time-series data for a specific page
    if (getTimeseries && pageId && pageId in TRACKED_PAGES) {
      const timeseries = await fetchCountTimeseries(kv, 'pageviews', 'pageviews_daily', pageId, period);
      const visitorsTimeseries = await getVisitorsTimeseriesData(kv, pageId, period);
      return new Response(
        JSON.stringify({ pageId, timeseries, visitorsTimeseries, period }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Get stats for a specific page
    if (pageId && pageId in TRACKED_PAGES) {
      const totalKey = TRACKED_PAGES[pageId].key;
      const totalVisitorsKey = `visitors_total:${pageId}`;
      const todayKey = `visitors:${pageId}:${getDateKey(Date.now())}`;

      const totalViews = await kv.get(totalKey);
      const totalVisitors = await kv.get(totalVisitorsKey);
      const todayVisitorsJson = await kv.get(todayKey);
      let todayVisitors = 0;
      try {
        const visitors = todayVisitorsJson ? JSON.parse(todayVisitorsJson) : [];
        todayVisitors = visitors.length;
      } catch {
        todayVisitors = 0;
      }

      return new Response(
        JSON.stringify({
          pageId,
          label: TRACKED_PAGES[pageId].label,
          totalViews: parseInt(totalViews || '0', 10) || 0,
          totalVisitors: parseInt(totalVisitors || '0', 10) || 0,
          todayVisitors,
        }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Get stats for all pages
    if (getAll) {
      const stats: Record<string, {
        label: string;
        totalViews: number;
        totalVisitors: number;
        todayVisitors: number;
      }> = {};

      for (const [id, config] of Object.entries(TRACKED_PAGES)) {
        const totalVisitorsKey = `visitors_total:${id}`;
        const todayKey = `visitors:${id}:${getDateKey(Date.now())}`;

        const totalViews = await kv.get(config.key);
        const totalVisitors = await kv.get(totalVisitorsKey);
        const todayVisitorsJson = await kv.get(todayKey);
        let todayVisitors = 0;
        try {
          const visitors = todayVisitorsJson ? JSON.parse(todayVisitorsJson) : [];
          todayVisitors = visitors.length;
        } catch {
          todayVisitors = 0;
        }

        stats[id] = {
          label: config.label,
          totalViews: parseInt(totalViews || '0', 10) || 0,
          totalVisitors: parseInt(totalVisitors || '0', 10) || 0,
          todayVisitors,
        };
      }

      return new Response(
        JSON.stringify({ stats }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Default: return all stats
    return new Response(
      JSON.stringify({ message: 'Use ?all=true or ?pageId=home|okr|konseptspeil' }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Error fetching page view stats:', error);
    return new Response(
      JSON.stringify({ stats: null, error: 'Failed to fetch stats' }),
      { status: 500, headers: API_HEADERS }
    );
  }
};

