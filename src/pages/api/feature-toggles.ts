import type { APIRoute, AstroCookies } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

import {
  getFeatureToggles,
  saveFeatureToggles,
  type FeatureToggle,
  type FeatureStatus,
} from '../../utils/feature-toggles';
import { API_HEADERS } from '../../utils/analytics-helpers';
import { validateOrigin } from '../../lib/validate-origin';
import { verifyToken, extractBearerToken } from '../../utils/verify-token';
import { FEATURE_TOGGLES_TOKEN_COOKIE } from '../../lib/token-cookie';

/** Bearer header (scripts) or the cookie set by the /feature-toggles page (browser). */
function providedToken(request: Request, cookies: AstroCookies): string | null {
  return extractBearerToken(request) ?? cookies.get(FEATURE_TOGGLES_TOKEN_COOKIE.name)?.value ?? null;
}

/**
 * GET /api/feature-toggles
 * Returns all feature toggles
 * Auth: Authorization: Bearer <token>, or the feature_toggles_token cookie
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  const expectedToken = env.FEATURE_TOGGLE_TOKEN;

  if (!verifyToken(providedToken(request, cookies), expectedToken)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: API_HEADERS,
    });
  }

  const kv = env.ANALYTICS_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 500,
      headers: API_HEADERS,
    });
  }

  const toggles = await getFeatureToggles(kv);

  return new Response(JSON.stringify(toggles), {
    status: 200,
    headers: API_HEADERS,
  });
};

/**
 * POST /api/feature-toggles
 * Updates feature toggles
 * Auth: Authorization: Bearer <token>, or the feature_toggles_token cookie
 * Body: { features: FeatureToggle[] }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // CSRF protection - validate origin header
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'CSRF check failed' }), {
      status: 403,
      headers: API_HEADERS,
    });
  }

  const expectedToken = env.FEATURE_TOGGLE_TOKEN;

  let body: { features?: FeatureToggle[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: API_HEADERS,
    });
  }

  if (!verifyToken(providedToken(request, cookies), expectedToken)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: API_HEADERS,
    });
  }

  // Validate features
  if (!body.features || !Array.isArray(body.features)) {
    return new Response(JSON.stringify({ error: 'Missing features array' }), {
      status: 400,
      headers: API_HEADERS,
    });
  }

  // Validate each feature
  const validStatuses: FeatureStatus[] = ['off', 'beta', 'on'];
  for (const feature of body.features) {
    if (!feature.id || typeof feature.id !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid feature id' }), {
        status: 400,
        headers: API_HEADERS,
      });
    }
    if (!validStatuses.includes(feature.status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status for feature ${feature.id}` }),
        {
          status: 400,
          headers: API_HEADERS,
        }
      );
    }
  }

  const kv = env.ANALYTICS_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 500,
      headers: API_HEADERS,
    });
  }

  await saveFeatureToggles(kv, body.features);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: API_HEADERS,
  });
};
