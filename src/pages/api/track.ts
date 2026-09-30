import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { shouldExcludeRequest } from '../../utils/tracking-exclusion';
import { verifySignedRequest } from '../../utils/request-signing';
import { recordClick } from '../../lib/stats-db';
import { API_HEADERS, getDateKey } from '../../utils/analytics-helpers';
import type { EventMetadata, ErrorType } from '../../utils/analytics-metrics';
import { getVisitorHash } from '../../utils/visitor-hash';

export const prerender = false;

/**
 * Valid button IDs for tracking
 * Each button has a unique key stored in Cloudflare KV
 */
export const TRACKED_BUTTONS = {
  // OKR-sjekken page buttons
  okr_submit: { label: 'Sjekk OKR-settet ditt' },
  okr_example: { label: 'Prøv med eksempel' },
  okr_reset: { label: 'Nullstill' },
  okr_privacy_toggle: { label: 'Les mer om AI og personvern' },
  okr_copy_suggestion: { label: 'Kopier til utklippstavle' },
  okr_read_more: { label: 'Les mer (vurdering)' },
  okr_re_evaluate: { label: 'Vurder forslaget på nytt' },
  okr_input_started: { label: 'OKR startet å skrive' },

  // OKR-sjekken funnel events
  okr_submit_attempted: { label: 'OKR innsending forsøkt' },
  okr_success: { label: 'OKR-sjekk fullført' },
  okr_error: { label: 'OKR-sjekk feil' },
  feedback_up: { label: 'Tilbakemelding: Nyttig' },
  feedback_down: { label: 'Tilbakemelding: Ikke nyttig' },

  // Konseptspeilet page buttons
  konseptspeil_submit: { label: 'Avdekk antagelser' },
  konseptspeil_example: { label: 'Prøv med eksempel' },
  konseptspeil_edit: { label: 'Rediger' },
  konseptspeil_reset: { label: 'Nullstill' },
  konseptspeil_input_started: { label: 'Startet å skrive' },
  konseptspeil_privacy_toggle: { label: 'Les mer om AI og personvern' },
  konseptspeil_share_colleague: { label: 'Del med kollega' },
  konseptspeil_copy_analysis: { label: 'Kopier analyse' },

  // Konseptspeilet funnel events
  konseptspeil_submit_attempted: { label: 'Konseptspeil innsending forsøkt' },
  konseptspeil_success: { label: 'Konseptspeil fullført' },
  konseptspeil_error: { label: 'Konseptspeil feil' },
  konseptspeil_feedback_up: { label: 'Tilbakemelding: Nyttig' },
  konseptspeil_feedback_down: { label: 'Tilbakemelding: Ikke nyttig' },
  konseptspeil_feedback_qualitative: { label: 'Tilbakemelding: Utdypet' },
  konseptspeil_retry: { label: 'Konseptspeil nytt forsøk' },

  // Antakelseskart page buttons
  antakelseskart_submit: { label: 'Generer antakelseskart' },
  antakelseskart_example: { label: 'Prøv med eksempel' },
  antakelseskart_reset: { label: 'Nullstill' },
  antakelseskart_copy: { label: 'Kopier' },
  antakelseskart_copy_summary: { label: 'Kopier oppsummering' },
  antakelseskart_edit: { label: 'Rediger' },
  antakelseskart_input_started: { label: 'Startet å skrive' },
  antakelseskart_privacy_toggle: { label: 'Les mer om AI og personvern' },

  // Antakelseskart funnel events
  antakelseskart_submit_attempted: { label: 'Antakelseskart innsending forsøkt' },
  antakelseskart_success: { label: 'Antakelseskart fullført' },
  antakelseskart_error: { label: 'Antakelseskart feil' },
  antakelseskart_retry: { label: 'Antakelseskart nytt forsøk' },

  // Beslutningslogg page buttons
  beslutningslogg_generate: { label: 'Lag Markdown' },
  beslutningslogg_copy: { label: 'Kopier Markdown' },
  beslutningslogg_reset: { label: 'Start på nytt' },

  // Pre-Mortem page buttons
  premortem_submit: { label: 'Generer Pre-Mortem Brief' },
  premortem_copy: { label: 'Kopier brief' },
  premortem_reset: { label: 'Start på nytt' },
  premortem_input_started: { label: 'Startet å fylle ut' },
  premortem_privacy_toggle: { label: 'Les mer om AI og personvern' },

  // Pre-Mortem funnel events
  premortem_submit_attempted: { label: 'Pre-Mortem innsending forsøkt' },
  premortem_success: { label: 'Pre-Mortem fullført' },
  premortem_error: { label: 'Pre-Mortem feil' },
  premortem_retry: { label: 'Pre-Mortem nytt forsøk' },

  // Security / operational events
  rate_limit_hit: { label: 'Rate limit truffet' },
  rate_limit_hit_okr: { label: 'Rate limit OKR' },
  rate_limit_hit_konseptspeil: { label: 'Rate limit Konseptspeil' },
  rate_limit_hit_antakelseskart: { label: 'Rate limit Antakelseskart' },
  rate_limit_hit_premortem: { label: 'Rate limit Pre-Mortem' },

  // Landing page buttons
  hero_cta: { label: 'Kontakt FYRK (hero)' },
  hero_secondary_cta: { label: 'Sekundær CTA (hero)' },
  nav_cta: { label: 'Kontakt (meny)' },
  nav_cta_mobile: { label: 'Kontakt (mobilmeny)' },
  tools_okr_cta: { label: 'Prøv OKR-sjekken' },
  tools_konseptspeilet_cta: { label: 'Prøv konseptspeilet' },
  contact_email: { label: 'E-post (kontakt)' },
  contact_linkedin: { label: 'LinkedIn (kontakt)' },
  about_linkedin: { label: 'Se komplett CV på LinkedIn' },
} as const;

export type ButtonId = keyof typeof TRACKED_BUTTONS;

// EventMetadata type imported from analytics-metrics.ts

/**
 * POST /api/track
 * Counts a click or tool event (with tool metrics) in the D1 stats database.
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

    // The visitor hash's daily salt lives in KV; the stats themselves in D1
    const kv = env.ANALYTICS_KV;
    const db = env.STATS_DB;

    if (!kv || !db) {
      console.warn('ANALYTICS_KV or STATS_DB not configured, tracking disabled');
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

    const timestamp = Date.now();
    const visitorHash = await getVisitorHash(request, kv, getDateKey(timestamp));
    await recordClick(db, { timestamp, buttonId, visitorHash, metadata: metadata ?? {} });

    return new Response(
      JSON.stringify({ success: true, buttonId }),
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
