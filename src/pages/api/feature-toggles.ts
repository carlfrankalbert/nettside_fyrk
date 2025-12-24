import type { APIRoute } from 'astro';
import {
  getFeatureToggles,
  saveFeatureToggles,
  type FeatureToggle,
  type FeatureStatus,
} from '../../utils/feature-toggles';

/**
 * GET /api/feature-toggles?token=<FEATURE_TOGGLE_TOKEN>
 * Returns all feature toggles
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const cloudflareEnv = (locals as App.Locals).runtime?.env;
  const expectedToken = cloudflareEnv?.FEATURE_TOGGLE_TOKEN;

  // Check authorization
  const url = new URL(request.url);
  const providedToken = url.searchParams.get('token');

  if (!expectedToken || providedToken !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = cloudflareEnv?.ANALYTICS_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const toggles = await getFeatureToggles(kv);

  return new Response(JSON.stringify(toggles), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * POST /api/feature-toggles
 * Updates feature toggles
 * Body: { token: string, features: FeatureToggle[] }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const cloudflareEnv = (locals as App.Locals).runtime?.env;
  const expectedToken = cloudflareEnv?.FEATURE_TOGGLE_TOKEN;

  let body: { token?: string; features?: FeatureToggle[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check authorization
  if (!expectedToken || body.token !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate features
  if (!body.features || !Array.isArray(body.features)) {
    return new Response(JSON.stringify({ error: 'Missing features array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate each feature
  const validStatuses: FeatureStatus[] = ['off', 'beta', 'on'];
  for (const feature of body.features) {
    if (!feature.id || typeof feature.id !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid feature id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!validStatuses.includes(feature.status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status for feature ${feature.id}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  const kv = cloudflareEnv?.ANALYTICS_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await saveFeatureToggles(kv, body.features);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
