import type { APIRoute } from 'astro';
import { shouldExcludeRequest } from '../../utils/tracking-exclusion';
import { verifySignedRequest } from '../../utils/request-signing';

export const prerender = false;

/** Standard headers for API responses - prevents CDN caching of dynamic data */
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

/**
 * Maximum unique visitors to track per day per page
 * Prevents unbounded array growth in KV storage
 * After this limit, we stop adding new hashes but still count pageviews
 */
const MAX_UNIQUE_VISITORS_PER_DAY = 10000;

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
} as const;

export type PageId = keyof typeof TRACKED_PAGES;

/**
 * Get the date string for a timestamp (YYYY-MM-DD)
 */
function getDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Get the hour key for a timestamp (YYYY-MM-DD-HH)
 */
function getHourKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toISOString().split('T')[0]}-${String(date.getUTCHours()).padStart(2, '0')}`;
}

/**
 * Create a SHA-256 hash of a string (for anonymous visitor tracking)
 * Uses Web Crypto API for GDPR-compliant one-way hashing
 */
async function sha256Hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * POST /api/pageview
 * Tracks page views and unique visitors.
 * Uses Cloudflare KV for storage - no cookies, no personal data stored.
 *
 * Request body: { pageId: string }
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Exclude automated browsers and test traffic
    if (shouldExcludeRequest(request)) {
      return new Response(
        JSON.stringify({ success: true, message: 'Excluded from tracking' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Parse and verify signed request
    let pageId: PageId = 'home';
    try {
      const rawBody = await request.json() as {
        payload?: { pageId?: string };
        _ts?: number;
        _sig?: string;
      };

      // Verify request signature
      const verification = verifySignedRequest<{ pageId?: string }>(rawBody);

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
    } catch {
      // No body or invalid JSON - use default
    }

    const timestamp = Date.now();
    const dateKey = getDateKey(timestamp);
    const hourKey = getHourKey(timestamp);

    // Get visitor identifier from IP (anonymized)
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const ip = cfConnectingIP || xForwardedFor?.split(',')[0]?.trim() || 'unknown';
    const visitorHash = await sha256Hash(ip + dateKey); // SHA-256, changes daily for privacy

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
      expirationTtl: 400 * 24 * 60 * 60,
    });

    // Store daily page view data
    const dailyKey = `pageviews_daily:${pageId}:${dateKey}`;
    const dailyCount = await kv.get(dailyKey);
    const newDailyCount = (parseInt(dailyCount || '0', 10) || 0) + 1;
    await kv.put(dailyKey, String(newDailyCount), {
      expirationTtl: 400 * 24 * 60 * 60,
    });

    // Track unique visitors per day using a set stored as JSON
    // Limited to MAX_UNIQUE_VISITORS_PER_DAY to prevent unbounded growth
    const visitorsKey = `visitors:${pageId}:${dateKey}`;
    const visitorsJson = await kv.get(visitorsKey);
    let visitors: string[] = [];
    try {
      visitors = visitorsJson ? JSON.parse(visitorsJson) : [];
    } catch {
      visitors = [];
    }

    let isNewVisitor = false;
    if (!visitors.includes(visitorHash)) {
      isNewVisitor = true;

      // Only store if under the limit (prevents unbounded array growth)
      if (visitors.length < MAX_UNIQUE_VISITORS_PER_DAY) {
        visitors.push(visitorHash);
        await kv.put(visitorsKey, JSON.stringify(visitors), {
          expirationTtl: 400 * 24 * 60 * 60,
        });
      }

      // Always update total unique visitors counter (even if array is at limit)
      const totalVisitorsKey = `visitors_total:${pageId}`;
      const currentTotalVisitors = await kv.get(totalVisitorsKey);
      const newTotalVisitors = (parseInt(currentTotalVisitors || '0', 10) || 0) + 1;
      await kv.put(totalVisitorsKey, String(newTotalVisitors));
    }

    return new Response(
      JSON.stringify({ success: true, pageId, views: newTotal, isNewVisitor }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Page view tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 200, headers: API_HEADERS }
    );
  }
};

/**
 * Time period definitions
 */
const TIME_PERIODS = {
  '24h': { hours: 24, granularity: 'hourly' as const },
  'week': { hours: 24 * 7, granularity: 'daily' as const },
  'month': { hours: 24 * 30, granularity: 'daily' as const },
  'year': { hours: 24 * 365, granularity: 'monthly' as const },
  'all': { hours: 24 * 365 * 2, granularity: 'monthly' as const },
} as const;

type TimePeriod = keyof typeof TIME_PERIODS;

/**
 * GET /api/pageview
 * Returns page view and visitor statistics.
 *
 * Query params:
 * - pageId: (optional) specific page to get stats for
 * - all: (optional) if 'true', returns stats for all pages
 * - timeseries: (optional) if 'true', returns time-series data
 * - period: (optional) time period: '24h', 'week', 'month', 'year', 'all'
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      return new Response(
        JSON.stringify({ stats: null, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    const pageId = url.searchParams.get('pageId') as PageId | null;
    const getAll = url.searchParams.get('all') === 'true';
    const getTimeseries = url.searchParams.get('timeseries') === 'true';
    const period = (url.searchParams.get('period') || '24h') as TimePeriod;

    // Get time-series data for a specific page
    if (getTimeseries && pageId && pageId in TRACKED_PAGES) {
      const timeseries = await getTimeseriesData(kv, pageId, period);
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

/**
 * Fetch page view time-series data
 */
async function getTimeseriesData(
  kv: KVNamespace,
  pageId: PageId,
  period: TimePeriod
): Promise<{ label: string; value: number }[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();
  const data: { label: string; value: number }[] = [];

  if (config.granularity === 'hourly') {
    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const hourKey = getHourKey(time);
      const key = `pageviews:${pageId}:${hourKey}`;
      const count = await kv.get(key);
      const date = new Date(time);
      data.push({
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
        value: parseInt(count || '0', 10) || 0,
      });
    }
  } else if (config.granularity === 'daily') {
    const days = period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const key = `pageviews_daily:${pageId}:${dateKey}`;
      const count = await kv.get(key);
      const date = new Date(time);
      data.push({
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        value: parseInt(count || '0', 10) || 0,
      });
    }
  } else if (config.granularity === 'monthly') {
    const months = period === 'year' ? 12 : 24;
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      let monthTotal = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const key = `pageviews_daily:${pageId}:${dateKey}`;
        const count = await kv.get(key);
        monthTotal += parseInt(count || '0', 10) || 0;
      }

      const monthNames = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
      data.push({
        label: `${monthNames[month]} ${year.toString().slice(2)}`,
        value: monthTotal,
      });
    }
  }

  return data;
}

/**
 * Fetch unique visitors time-series data
 */
async function getVisitorsTimeseriesData(
  kv: KVNamespace,
  pageId: PageId,
  period: TimePeriod
): Promise<{ label: string; value: number }[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();
  const data: { label: string; value: number }[] = [];

  // For hourly, we can't really show unique visitors per hour accurately
  // So for 24h we'll just show the total for today
  if (config.granularity === 'hourly') {
    const todayKey = `visitors:${pageId}:${getDateKey(now)}`;
    const todayVisitorsJson = await kv.get(todayKey);
    let count = 0;
    try {
      const visitors = todayVisitorsJson ? JSON.parse(todayVisitorsJson) : [];
      count = visitors.length;
    } catch {
      count = 0;
    }

    // Fill with same value for display purposes
    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const date = new Date(time);
      data.push({
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
        value: i === 23 ? count : 0, // Only show on last hour
      });
    }
  } else if (config.granularity === 'daily') {
    const days = period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const key = `visitors:${pageId}:${dateKey}`;
      const visitorsJson = await kv.get(key);
      let count = 0;
      try {
        const visitors = visitorsJson ? JSON.parse(visitorsJson) : [];
        count = visitors.length;
      } catch {
        count = 0;
      }
      const date = new Date(time);
      data.push({
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        value: count,
      });
    }
  } else if (config.granularity === 'monthly') {
    const months = period === 'year' ? 12 : 24;
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // Count unique visitors across the month
      const uniqueVisitors = new Set<string>();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const key = `visitors:${pageId}:${dateKey}`;
        const visitorsJson = await kv.get(key);
        try {
          const visitors = visitorsJson ? JSON.parse(visitorsJson) : [];
          visitors.forEach((v: string) => uniqueVisitors.add(v));
        } catch {
          // Skip
        }
      }

      const monthNames = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
      data.push({
        label: `${monthNames[month]} ${year.toString().slice(2)}`,
        value: uniqueVisitors.size,
      });
    }
  }

  return data;
}
