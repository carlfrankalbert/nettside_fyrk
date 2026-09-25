import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { shouldExcludeRequest } from '../../utils/tracking-exclusion';
import { verifySignedRequest } from '../../utils/request-signing';
import { API_HEADERS, getDateKey, getHourKey, fetchCountTimeseries, type TimePeriod } from '../../utils/analytics-helpers';
import { ANALYTICS_CONFIG } from '../../utils/constants';
import { aggregateEventMetrics, type EventMetadata, type ErrorType } from '../../utils/analytics-metrics';
import { getVisitorHash, addToVisitorSet } from '../../utils/visitor-hash';

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
  okr_re_evaluate: { key: 'okr_re_evaluate_clicks', label: 'Vurder forslaget på nytt' },
  okr_input_started: { key: 'okr_input_started', label: 'OKR startet å skrive' },

  // OKR-sjekken funnel events
  okr_submit_attempted: { key: 'okr_submit_attempted', label: 'OKR innsending forsøkt' },
  okr_success: { key: 'okr_check_success', label: 'OKR-sjekk fullført' },
  okr_error: { key: 'okr_error', label: 'OKR-sjekk feil' },
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
  konseptspeil_submit_attempted: { key: 'konseptspeil_submit_attempted', label: 'Konseptspeil innsending forsøkt' },
  konseptspeil_success: { key: 'konseptspeil_success', label: 'Konseptspeil fullført' },
  konseptspeil_error: { key: 'konseptspeil_error', label: 'Konseptspeil feil' },
  konseptspeil_feedback_up: { key: 'konseptspeil_feedback_up', label: 'Tilbakemelding: Nyttig' },
  konseptspeil_feedback_down: { key: 'konseptspeil_feedback_down', label: 'Tilbakemelding: Ikke nyttig' },
  konseptspeil_feedback_qualitative: { key: 'konseptspeil_feedback_qualitative', label: 'Tilbakemelding: Utdypet' },
  konseptspeil_retry: { key: 'konseptspeil_retry', label: 'Konseptspeil nytt forsøk' },

  // Antakelseskart page buttons
  antakelseskart_submit: { key: 'antakelseskart_submit_clicks', label: 'Generer antakelseskart' },
  antakelseskart_example: { key: 'antakelseskart_example_clicks', label: 'Prøv med eksempel' },
  antakelseskart_reset: { key: 'antakelseskart_reset_clicks', label: 'Nullstill' },
  antakelseskart_copy: { key: 'antakelseskart_copy_clicks', label: 'Kopier' },
  antakelseskart_copy_summary: { key: 'antakelseskart_copy_summary_clicks', label: 'Kopier oppsummering' },
  antakelseskart_edit: { key: 'antakelseskart_edit_clicks', label: 'Rediger' },
  antakelseskart_input_started: { key: 'antakelseskart_input_started', label: 'Startet å skrive' },
  antakelseskart_privacy_toggle: { key: 'antakelseskart_privacy_toggle_clicks', label: 'Les mer om AI og personvern' },

  // Antakelseskart funnel events
  antakelseskart_submit_attempted: { key: 'antakelseskart_submit_attempted', label: 'Antakelseskart innsending forsøkt' },
  antakelseskart_success: { key: 'antakelseskart_success', label: 'Antakelseskart fullført' },
  antakelseskart_error: { key: 'antakelseskart_error', label: 'Antakelseskart feil' },
  antakelseskart_retry: { key: 'antakelseskart_retry', label: 'Antakelseskart nytt forsøk' },

  // Beslutningslogg page buttons
  beslutningslogg_generate: { key: 'beslutningslogg_generate_clicks', label: 'Lag Markdown' },
  beslutningslogg_copy: { key: 'beslutningslogg_copy_clicks', label: 'Kopier Markdown' },
  beslutningslogg_reset: { key: 'beslutningslogg_reset_clicks', label: 'Start på nytt' },

  // Pre-Mortem page buttons
  premortem_submit: { key: 'premortem_submit_clicks', label: 'Generer Pre-Mortem Brief' },
  premortem_copy: { key: 'premortem_copy_clicks', label: 'Kopier brief' },
  premortem_reset: { key: 'premortem_reset_clicks', label: 'Start på nytt' },
  premortem_input_started: { key: 'premortem_input_started', label: 'Startet å fylle ut' },
  premortem_privacy_toggle: { key: 'premortem_privacy_toggle_clicks', label: 'Les mer om AI og personvern' },

  // Pre-Mortem funnel events
  premortem_submit_attempted: { key: 'premortem_submit_attempted', label: 'Pre-Mortem innsending forsøkt' },
  premortem_success: { key: 'premortem_success', label: 'Pre-Mortem fullført' },
  premortem_error: { key: 'premortem_error', label: 'Pre-Mortem feil' },
  premortem_retry: { key: 'premortem_retry', label: 'Pre-Mortem nytt forsøk' },

  // Security / operational events
  rate_limit_hit: { key: 'rate_limit_hits', label: 'Rate limit truffet' },
  rate_limit_hit_okr: { key: 'rate_limit_hits_okr', label: 'Rate limit OKR' },
  rate_limit_hit_konseptspeil: { key: 'rate_limit_hits_konseptspeil', label: 'Rate limit Konseptspeil' },
  rate_limit_hit_antakelseskart: { key: 'rate_limit_hits_antakelseskart', label: 'Rate limit Antakelseskart' },
  rate_limit_hit_premortem: { key: 'rate_limit_hits_premortem', label: 'Rate limit Pre-Mortem' },

  // Landing page buttons
  hero_cta: { key: 'hero_cta_clicks', label: 'Kontakt FYRK (hero)' },
  hero_secondary_cta: { key: 'hero_secondary_cta_clicks', label: 'Sekundær CTA (hero)' },
  nav_cta: { key: 'nav_cta_clicks', label: 'Kontakt (meny)' },
  nav_cta_mobile: { key: 'nav_cta_mobile_clicks', label: 'Kontakt (mobilmeny)' },
  tools_okr_cta: { key: 'tools_okr_cta_clicks', label: 'Prøv OKR-sjekken' },
  tools_konseptspeilet_cta: { key: 'tools_konseptspeilet_cta_clicks', label: 'Prøv konseptspeilet' },
  contact_email: { key: 'contact_email_clicks', label: 'E-post (kontakt)' },
  contact_linkedin: { key: 'contact_linkedin_clicks', label: 'LinkedIn (kontakt)' },
  about_linkedin: { key: 'about_linkedin_clicks', label: 'Se komplett CV på LinkedIn' },
} as const;

export type ButtonId = keyof typeof TRACKED_BUTTONS;

// EventMetadata type imported from analytics-metrics.ts

/**
 * POST /api/track
 * Increments the click counter for a specific button and stores timestamp.
 * Cookieless: unique visitors per event are counted with a daily-salted hash.
 *
 * Request body: { buttonId: string, metadata?: { charCount?: number, processingTimeMs?: number } }
 * Unknown or missing buttonId → 400, so a new event can never be miscounted as another.
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
      console.warn('ANALYTICS_KV not configured, tracking disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: API_HEADERS }
      );
    }

    // Parse and verify signed request
    let buttonId: ButtonId | undefined;
    let metadata: EventMetadata | undefined;
    try {
      const rawBody = await request.json() as {
        payload?: {
          buttonId?: string;
          metadata?: EventMetadata;
        };
        _ts?: number;
        _sig?: string;
      };

      // Verify request signature
      const verification = verifySignedRequest<{
        buttonId?: string;
        metadata?: EventMetadata;
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
      // Extract and sanitize metadata (no PII)
      if (body.metadata) {
        metadata = {
          charCount: typeof body.metadata.charCount === 'number' ? Math.round(body.metadata.charCount) : undefined,
          processingTimeMs: typeof body.metadata.processingTimeMs === 'number' ? Math.round(body.metadata.processingTimeMs) : undefined,
          errorType: typeof body.metadata.errorType === 'string' ? body.metadata.errorType as ErrorType : undefined,
          cached: typeof body.metadata.cached === 'boolean' ? body.metadata.cached : undefined,
          inputLength: typeof body.metadata.inputLength === 'number' ? Math.round(body.metadata.inputLength) : undefined,
          toolVersion: typeof body.metadata.toolVersion === 'string' ? body.metadata.toolVersion.slice(0, 20) : undefined,
        };
      }
    } catch {
      // No body or invalid JSON - rejected below
    }

    if (!buttonId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown event' }),
        { status: 400, headers: API_HEADERS }
      );
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
        expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
      }),
      kv.put(dailyKey, String(newDailyCount), {
        expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
      }),
    ];

    // Aggregated per-event metrics, including unique visitors per day
    const visitorHash = await getVisitorHash(request, kv, dateKey);
    const isNewVisitor = await addToVisitorSet(kv, `event_visitors:${buttonId}:${dateKey}`, visitorHash);
    writePromises.push(
      aggregateEventMetrics(kv, buttonId, dateKey, metadata ?? {}, timestamp, isNewVisitor)
    );

    await Promise.all(writePromises);

    return new Response(
      JSON.stringify({ success: true, buttonId, count: newCount }),
      { status: 200, headers: API_HEADERS }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 500, headers: API_HEADERS }
    );
  }
};

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
export const GET: APIRoute = async ({ url }) => {
  try {
    const kv = env.ANALYTICS_KV;

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
      const timeseries = await fetchCountTimeseries(kv, 'clicks', 'clicks_daily', buttonId, period);
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

    return new Response(
      JSON.stringify({ counts: null, message: 'No buttonId or all=true specified' }),
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

