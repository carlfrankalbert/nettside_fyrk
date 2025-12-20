import type { APIRoute } from 'astro';

export const prerender = false;

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

  // Landing page buttons
  hero_cta: { key: 'hero_cta_clicks', label: 'Kontakt FYRK (hero)' },
  tools_okr_cta: { key: 'tools_okr_cta_clicks', label: 'Prøv OKR-sjekken' },
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
 * POST /api/track
 * Increments the click counter for a specific button and stores timestamp.
 * Uses Cloudflare KV for storage - no cookies, no personal data.
 *
 * Request body: { buttonId: string }
 * If no buttonId provided, defaults to 'okr_submit' for backwards compatibility
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      console.warn('ANALYTICS_KV not configured, tracking disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body to get buttonId
    let buttonId: ButtonId = 'okr_submit'; // default for backwards compatibility
    try {
      const body = await request.json();
      if (body.buttonId && body.buttonId in TRACKED_BUTTONS) {
        buttonId = body.buttonId as ButtonId;
      }
    } catch {
      // No body or invalid JSON - use default
    }

    const kvKey = TRACKED_BUTTONS[buttonId].key;
    const timestamp = Date.now();
    const dateKey = getDateKey(timestamp);
    const hourKey = getHourKey(timestamp);

    // Update total count (legacy)
    const currentCount = await kv.get(kvKey);
    const newCount = (parseInt(currentCount || '0', 10) || 0) + 1;
    await kv.put(kvKey, String(newCount));

    // Store hourly click data for time-series charts
    // Key format: clicks:{buttonId}:{YYYY-MM-DD-HH}
    const hourlyKey = `clicks:${buttonId}:${hourKey}`;
    const hourlyCount = await kv.get(hourlyKey);
    const newHourlyCount = (parseInt(hourlyCount || '0', 10) || 0) + 1;
    await kv.put(hourlyKey, String(newHourlyCount), {
      // Expire after 400 days to keep storage manageable
      expirationTtl: 400 * 24 * 60 * 60,
    });

    // Store daily click data (for faster queries on longer time ranges)
    // Key format: clicks_daily:{buttonId}:{YYYY-MM-DD}
    const dailyKey = `clicks_daily:${buttonId}:${dateKey}`;
    const dailyCount = await kv.get(dailyKey);
    const newDailyCount = (parseInt(dailyCount || '0', 10) || 0) + 1;
    await kv.put(dailyKey, String(newDailyCount), {
      expirationTtl: 400 * 24 * 60 * 60,
    });

    return new Response(
      JSON.stringify({ success: true, buttonId, count: newCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get single button count
    if (buttonId && buttonId in TRACKED_BUTTONS) {
      const kvKey = TRACKED_BUTTONS[buttonId].key;
      const currentCount = await kv.get(kvKey);
      const count = parseInt(currentCount || '0', 10) || 0;

      return new Response(
        JSON.stringify({ buttonId, count, label: TRACKED_BUTTONS[buttonId].label }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all button counts
    if (getAll) {
      const counts: Record<string, { count: number; label: string }> = {};

      for (const [id, config] of Object.entries(TRACKED_BUTTONS)) {
        const currentCount = await kv.get(config.key);
        counts[id] = {
          count: parseInt(currentCount || '0', 10) || 0,
          label: config.label,
        };
      }

      return new Response(
        JSON.stringify({ counts }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default: return legacy okr_button_clicks for backwards compatibility
    const currentCount = await kv.get(LEGACY_KV_KEY);
    const count = parseInt(currentCount || '0', 10) || 0;

    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching tracking count:', error);
    return new Response(
      JSON.stringify({ counts: null, error: 'Failed to fetch count' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Fetch time-series data for a button
 */
async function getTimeseriesData(
  kv: KVNamespace,
  buttonId: ButtonId,
  period: TimePeriod
): Promise<{ label: string; value: number }[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();
  const startTime = now - config.hours * 60 * 60 * 1000;
  const data: { label: string; value: number }[] = [];

  if (config.granularity === 'hourly') {
    // Get hourly data for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const hourKey = getHourKey(time);
      const key = `clicks:${buttonId}:${hourKey}`;
      const count = await kv.get(key);
      const date = new Date(time);
      data.push({
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
        value: parseInt(count || '0', 10) || 0,
      });
    }
  } else if (config.granularity === 'daily') {
    // Get daily data
    const days = period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const key = `clicks_daily:${buttonId}:${dateKey}`;
      const count = await kv.get(key);
      const date = new Date(time);
      data.push({
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        value: parseInt(count || '0', 10) || 0,
      });
    }
  } else if (config.granularity === 'monthly') {
    // Get monthly data (aggregate daily data)
    const months = period === 'year' ? 12 : 24;
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      // Sum up all daily counts for this month
      let monthTotal = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const key = `clicks_daily:${buttonId}:${dateKey}`;
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
