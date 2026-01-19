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
 * Valid button IDs for tracking
 * Each button has a unique key stored in Cloudflare KV
 */
export const TRACKED_BUTTONS = {
  // OKR-sjekken page buttons
  okr_submit: { key: 'okr_button_clicks', label: 'Sjekk OKR-settet ditt' },
  okr_example: { key: 'okr_example_clicks', label: 'Prøv med eksempel' },
  okr_reset: { key: 'okr_reset_clicks', label: 'Nullstill' },
  okr_privacy_toggle: { key: 'okr_privacy_toggle_clicks', label: 'Les mer om AI og personvern' },
  okr_copy_suggestion: { key: 'okr_copy_suggestion_clicks', label: 'Kopier til utklippstavle' },
  okr_read_more: { key: 'okr_read_more_clicks', label: 'Les mer (vurdering)' },

  // OKR-sjekken funnel events
  check_success: { key: 'okr_check_success', label: 'OKR-sjekk fullført' },
  feedback_up: { key: 'okr_feedback_up', label: 'Tilbakemelding: Nyttig' },
  feedback_down: { key: 'okr_feedback_down', label: 'Tilbakemelding: Ikke nyttig' },

  // Konseptspeilet page buttons
  konseptspeil_submit: { key: 'konseptspeil_submit_clicks', label: 'Avdekk antagelser' },
  konseptspeil_example: { key: 'konseptspeil_example_clicks', label: 'Prøv med eksempel' },
  konseptspeil_edit: { key: 'konseptspeil_edit_clicks', label: 'Rediger' },
  konseptspeil_reset: { key: 'konseptspeil_reset_clicks', label: 'Nullstill' },
  konseptspeil_input_started: { key: 'konseptspeil_input_started', label: 'Startet å skrive' },
  konseptspeil_privacy_toggle: { key: 'konseptspeil_privacy_toggle_clicks', label: 'Les mer om AI og personvern' },
  konseptspeil_share_colleague: { key: 'konseptspeil_share_colleague_clicks', label: 'Del med kollega' },
  konseptspeil_copy_analysis: { key: 'konseptspeil_copy_analysis_clicks', label: 'Kopier analyse' },

  // Konseptspeilet funnel events
  konseptspeil_success: { key: 'konseptspeil_success', label: 'Konseptspeil fullført' },
  konseptspeil_error: { key: 'konseptspeil_error', label: 'Konseptspeil feil' },
  konseptspeil_feedback_up: { key: 'konseptspeil_feedback_up', label: 'Tilbakemelding: Nyttig' },
  konseptspeil_feedback_down: { key: 'konseptspeil_feedback_down', label: 'Tilbakemelding: Ikke nyttig' },

  // Security / operational events
  rate_limit_hit: { key: 'rate_limit_hits', label: 'Rate limit truffet' },
  rate_limit_hit_okr: { key: 'rate_limit_hits_okr', label: 'Rate limit OKR' },
  rate_limit_hit_konseptspeil: { key: 'rate_limit_hits_konseptspeil', label: 'Rate limit Konseptspeil' },
  rate_limit_hit_antakelseskart: { key: 'rate_limit_hits_antakelseskart', label: 'Rate limit Antakelseskart' },

  // Landing page buttons
  hero_cta: { key: 'hero_cta_clicks', label: 'Kontakt FYRK (hero)' },
  tools_okr_cta: { key: 'tools_okr_cta_clicks', label: 'Prøv OKR-sjekken' },
  tools_konseptspeilet_cta: { key: 'tools_konseptspeilet_cta_clicks', label: 'Prøv konseptspeilet' },
  contact_email: { key: 'contact_email_clicks', label: 'E-post (kontakt)' },
  contact_linkedin: { key: 'contact_linkedin_clicks', label: 'LinkedIn (kontakt)' },
  about_linkedin: { key: 'about_linkedin_clicks', label: 'Se komplett CV på LinkedIn' },
} as const;

export type ButtonId = keyof typeof TRACKED_BUTTONS;

// Legacy key for backwards compatibility
const LEGACY_KV_KEY = 'okr_button_clicks';

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
 * Metadata for check_success events (no PII)
 */
interface CheckSuccessMetadata {
  charCount?: number;
  processingTimeMs?: number;
}

/**
 * POST /api/track
 * Increments the click counter for a specific button and stores timestamp.
 * Uses Cloudflare KV for storage - no cookies, no personal data.
 *
 * Request body: { buttonId: string, metadata?: { charCount?: number, processingTimeMs?: number } }
 * If no buttonId provided, defaults to 'okr_submit' for backwards compatibility
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
      console.warn('ANALYTICS_KV not configured, tracking disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Parse and verify signed request
    let buttonId: ButtonId = 'okr_submit'; // default for backwards compatibility
    let metadata: CheckSuccessMetadata | undefined;
    try {
      const rawBody = await request.json() as {
        payload?: {
          buttonId?: string;
          metadata?: { charCount?: number; processingTimeMs?: number };
        };
        _ts?: number;
        _sig?: string;
      };

      // Verify request signature
      const verification = verifySignedRequest<{
        buttonId?: string;
        metadata?: { charCount?: number; processingTimeMs?: number };
      }>(rawBody);

      if (!verification.isValid) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request signature' }),
          { status: 400, headers: API_HEADERS }
        );
      }

      const body = verification.payload;
      if (body.buttonId && body.buttonId in TRACKED_BUTTONS) {
        buttonId = body.buttonId as ButtonId;
      }
      // Extract metadata for check_success events (sanitized, no PII)
      if (body.metadata && buttonId === 'check_success') {
        metadata = {
          charCount: typeof body.metadata.charCount === 'number' ? Math.round(body.metadata.charCount) : undefined,
          processingTimeMs: typeof body.metadata.processingTimeMs === 'number' ? Math.round(body.metadata.processingTimeMs) : undefined,
        };
      }
    } catch {
      // No body or invalid JSON - use default
    }

    const kvKey = TRACKED_BUTTONS[buttonId].key;
    const timestamp = Date.now();
    const dateKey = getDateKey(timestamp);
    const hourKey = getHourKey(timestamp);

    // Keys for all counters
    const hourlyKey = `clicks:${buttonId}:${hourKey}`;
    const dailyKey = `clicks_daily:${buttonId}:${dateKey}`;

    // Fetch all current counts in parallel for better performance
    const [currentCount, hourlyCount, dailyCount] = await Promise.all([
      kv.get(kvKey),
      kv.get(hourlyKey),
      kv.get(dailyKey),
    ]);

    // Calculate new counts
    const newCount = (parseInt(currentCount || '0', 10) || 0) + 1;
    const newHourlyCount = (parseInt(hourlyCount || '0', 10) || 0) + 1;
    const newDailyCount = (parseInt(dailyCount || '0', 10) || 0) + 1;

    // Write all updates in parallel for better performance
    const writePromises: Promise<void>[] = [
      kv.put(kvKey, String(newCount)),
      kv.put(hourlyKey, String(newHourlyCount), {
        expirationTtl: 400 * 24 * 60 * 60,
      }),
      kv.put(dailyKey, String(newDailyCount), {
        expirationTtl: 400 * 24 * 60 * 60,
      }),
    ];

    // Store aggregated metadata for check_success events
    if (buttonId === 'check_success' && metadata) {
      const metricsKey = `metrics:check_success:${dateKey}`;
      const existingMetricsJson = await kv.get(metricsKey);
      let metrics = { count: 0, totalCharCount: 0, totalProcessingTimeMs: 0 };
      try {
        if (existingMetricsJson) {
          metrics = JSON.parse(existingMetricsJson);
        }
      } catch {
        // Reset if parsing fails
      }

      metrics.count += 1;
      if (metadata.charCount) {
        metrics.totalCharCount += metadata.charCount;
      }
      if (metadata.processingTimeMs) {
        metrics.totalProcessingTimeMs += metadata.processingTimeMs;
      }

      writePromises.push(
        kv.put(metricsKey, JSON.stringify(metrics), {
          expirationTtl: 400 * 24 * 60 * 60,
        })
      );
    }

    await Promise.all(writePromises);

    return new Response(
      JSON.stringify({ success: true, buttonId, count: newCount }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 200, headers: API_HEADERS }
    );
  }
};

/**
 * Time period definitions for chart queries
 */
export const TIME_PERIODS = {
  '24h': { hours: 24, granularity: 'hourly' as const },
  'week': { hours: 24 * 7, granularity: 'daily' as const },
  'month': { hours: 24 * 30, granularity: 'daily' as const },
  'year': { hours: 24 * 365, granularity: 'monthly' as const },
  'all': { hours: 24 * 365 * 2, granularity: 'monthly' as const },
} as const;

export type TimePeriod = keyof typeof TIME_PERIODS;

/**
 * GET /api/track
 * Returns click counts for all tracked buttons or a specific button.
 * Can also return time-series data for charts.
 *
 * Query params:
 * - buttonId: (optional) specific button to get count for
 * - all: (optional) if 'true', returns counts for all buttons
 * - timeseries: (optional) if 'true', returns time-series data
 * - period: (optional) time period for timeseries: '24h', 'week', 'month', 'year', 'all'
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      return new Response(
        JSON.stringify({ counts: null, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    const buttonId = url.searchParams.get('buttonId') as ButtonId | null;
    const getAll = url.searchParams.get('all') === 'true';
    const getTimeseries = url.searchParams.get('timeseries') === 'true';
    const period = (url.searchParams.get('period') || '24h') as TimePeriod;

    // Get time-series data for a specific button
    if (getTimeseries && buttonId && buttonId in TRACKED_BUTTONS) {
      const timeseries = await getTimeseriesData(kv, buttonId, period);
      return new Response(
        JSON.stringify({ buttonId, timeseries, period }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Get single button count
    if (buttonId && buttonId in TRACKED_BUTTONS) {
      const kvKey = TRACKED_BUTTONS[buttonId].key;
      const currentCount = await kv.get(kvKey);
      const count = parseInt(currentCount || '0', 10) || 0;

      return new Response(
        JSON.stringify({ buttonId, count, label: TRACKED_BUTTONS[buttonId].label }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Get all button counts (in parallel for better performance)
    if (getAll) {
      const buttonEntries = Object.entries(TRACKED_BUTTONS);
      const countPromises = buttonEntries.map(([, config]) => kv.get(config.key));
      const countResults = await Promise.all(countPromises);

      const counts: Record<string, { count: number; label: string }> = {};
      buttonEntries.forEach(([id, config], index) => {
        counts[id] = {
          count: parseInt(countResults[index] || '0', 10) || 0,
          label: config.label,
        };
      });

      return new Response(
        JSON.stringify({ counts }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Default: return legacy okr_button_clicks for backwards compatibility
    const currentCount = await kv.get(LEGACY_KV_KEY);
    const count = parseInt(currentCount || '0', 10) || 0;

    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Error fetching tracking count:', error);
    return new Response(
      JSON.stringify({ counts: null, error: 'Failed to fetch count' }),
      { status: 500, headers: API_HEADERS }
    );
  }
};

/**
 * Fetch time-series data for a button (optimized with parallel fetches)
 */
async function getTimeseriesData(
  kv: KVNamespace,
  buttonId: ButtonId,
  period: TimePeriod
): Promise<{ label: string; value: number }[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();

  if (config.granularity === 'hourly') {
    // Prepare keys and labels for hourly data
    const entries: { key: string; label: string }[] = [];
    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const hourKey = getHourKey(time);
      const date = new Date(time);
      entries.push({
        key: `clicks:${buttonId}:${hourKey}`,
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
      });
    }

    // Fetch all in parallel
    const counts = await Promise.all(entries.map(e => kv.get(e.key)));

    return entries.map((entry, i) => ({
      label: entry.label,
      value: parseInt(counts[i] || '0', 10) || 0,
    }));
  }

  if (config.granularity === 'daily') {
    // Prepare keys and labels for daily data
    const days = period === 'week' ? 7 : 30;
    const entries: { key: string; label: string }[] = [];
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const date = new Date(time);
      entries.push({
        key: `clicks_daily:${buttonId}:${dateKey}`,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      });
    }

    // Fetch all in parallel
    const counts = await Promise.all(entries.map(e => kv.get(e.key)));

    return entries.map((entry, i) => ({
      label: entry.label,
      value: parseInt(counts[i] || '0', 10) || 0,
    }));
  }

  // Monthly granularity - need to aggregate daily data
  const months = period === 'year' ? 12 : 24;
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

  // Collect all daily keys needed for all months
  const allDayKeys: { monthIndex: number; key: string }[] = [];
  const monthLabels: string[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now);
    monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthLabels.push(`${monthNames[month]} ${year.toString().slice(2)}`);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allDayKeys.push({
        monthIndex: i,
        key: `clicks_daily:${buttonId}:${dateKey}`,
      });
    }
  }

  // Fetch all daily counts in parallel
  const dailyCounts = await Promise.all(allDayKeys.map(d => kv.get(d.key)));

  // Aggregate by month
  const monthTotals = new Array(months).fill(0);
  dailyCounts.forEach((count, i) => {
    monthTotals[allDayKeys[i].monthIndex] += parseInt(count || '0', 10) || 0;
  });

  return monthLabels.map((label, i) => ({
    label,
    value: monthTotals[i],
  }));
}
