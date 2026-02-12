import type { APIRoute } from 'astro';
import { TRACKED_BUTTONS } from './track';

export const prerender = false;

/**
 * Landing page buttons tracked via Astro script (properly filtered, should NOT be reset)
 */
const CLEAN_EVENTS = new Set([
  'hero_cta', 'tools_okr_cta', 'tools_konseptspeilet_cta',
  'contact_email', 'contact_linkedin', 'about_linkedin',
]);

/**
 * POST /api/reset-stats
 * Resets corrupted funnel/button data caused by missing client-side exclusion.
 * Preserves landing page button data (those used the properly-filtered Astro script).
 * Requires STATS_TOKEN for authorization.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  try {
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const expectedToken = cloudflareEnv?.STATS_TOKEN;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (!expectedToken || !kv) {
      return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500, headers });
    }

    // Auth check
    const body = await request.json() as { token?: string };
    if (body.token !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
    }

    // Identify events to reset (everything tracked via React's tracking.ts)
    const eventsToReset = Object.entries(TRACKED_BUTTONS)
      .filter(([id]) => !CLEAN_EVENTS.has(id))
      .map(([id, config]) => ({ id, totalKey: config.key }));

    // Generate date keys for last 90 days
    const dates: string[] = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Generate hour keys for last 7 days (more granular, shorter range)
    const hourKeys: string[] = [];
    for (let i = 0; i < 7 * 24; i++) {
      const d = new Date(Date.now() - i * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const hourStr = String(d.getUTCHours()).padStart(2, '0');
      hourKeys.push(`${dateStr}-${hourStr}`);
    }

    let deletedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < eventsToReset.length; i += batchSize) {
      const batch = eventsToReset.slice(i, i + batchSize);
      const ops: Promise<void>[] = [];

      for (const event of batch) {
        // Reset total counter
        ops.push(kv.put(event.totalKey, '0'));
        deletedCount++;

        // Delete daily keys
        for (const date of dates) {
          ops.push(kv.delete(`clicks_daily:${event.id}:${date}`));
          ops.push(kv.delete(`metrics:${event.id}:${date}`));
          deletedCount += 2;
        }

        // Delete hourly keys (last 7 days)
        for (const hourKey of hourKeys) {
          ops.push(kv.delete(`clicks:${event.id}:${hourKey}`));
          deletedCount++;
        }
      }

      await Promise.all(ops);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsReset: eventsToReset.map(e => e.id),
        keysAffected: deletedCount,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Reset error:', error);
    return new Response(
      JSON.stringify({ error: 'Reset failed' }),
      { status: 500, headers }
    );
  }
};
