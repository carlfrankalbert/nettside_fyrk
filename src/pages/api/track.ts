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
 * POST /api/track
 * Increments the click counter for a specific button.
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

    // Get current count
    const currentCount = await kv.get(kvKey);
    const newCount = (parseInt(currentCount || '0', 10) || 0) + 1;

    // Store new count
    await kv.put(kvKey, String(newCount));

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
 * GET /api/track
 * Returns click counts for all tracked buttons or a specific button.
 *
 * Query params:
 * - buttonId: (optional) specific button to get count for
 * - all: (optional) if 'true', returns counts for all buttons
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
