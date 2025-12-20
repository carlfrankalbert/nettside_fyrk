import type { APIRoute } from 'astro';

export const prerender = false;

const KV_KEY = 'okr_button_clicks';

/**
 * POST /api/track
 * Increments the click counter for the OKR check button.
 * Uses Cloudflare KV for storage - no cookies, no personal data.
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      // KV not configured - log but don't fail the request
      console.warn('ANALYTICS_KV not configured, tracking disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Tracking not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current count
    const currentCount = await kv.get(KV_KEY);
    const newCount = (parseInt(currentCount || '0', 10) || 0) + 1;

    // Store new count
    await kv.put(KV_KEY, String(newCount));

    return new Response(
      JSON.stringify({ success: true, count: newCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    // Don't fail the user experience if tracking fails
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking failed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/track
 * Returns the current click count.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!kv) {
      return new Response(
        JSON.stringify({ count: null, message: 'Tracking not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = await kv.get(KV_KEY);
    const count = parseInt(currentCount || '0', 10) || 0;

    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching tracking count:', error);
    return new Response(
      JSON.stringify({ count: null, error: 'Failed to fetch count' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
