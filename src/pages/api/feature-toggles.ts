import type { APIRoute } from 'astro';
import {
  getFeatureToggles,
  saveFeatureToggles,
  type FeatureToggle,
  type FeatureStatus,
} from '../../utils/feature-toggles';

/** Standard headers for API responses - prevents CDN caching of dynamic data */
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

/**
 * Validates that the request origin matches the expected host (CSRF protection)
 * Returns true if valid, false if CSRF check fails
 */
function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // If no origin header (same-origin request or non-browser), allow
  if (!origin) return true;

  // Extract hostname from origin (e.g., "https://fyrk.no" -> "fyrk.no")
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;

    // Check if origin matches host
    if (host && originHost === host) return true;

    // Allow localhost for development
    if (originHost.startsWith('localhost') || originHost.startsWith('127.0.0.1')) {
      return true;
    }

    // Allow fyrk.no domain (production)
    if (originHost === 'fyrk.no' || originHost.endsWith('.fyrk.no')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extract token from Authorization header (Bearer token) or query param (fallback)
 */
function extractToken(request: Request): string | null {
  // Prefer Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fallback to query param for backwards compatibility
  const url = new URL(request.url);
  return url.searchParams.get('token');
}

/**
 * GET /api/feature-toggles
 * Returns all feature toggles
 * Auth: Authorization: Bearer <token> (preferred) or ?token=<token> (deprecated)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const cloudflareEnv = (locals as App.Locals).runtime?.env;
  const expectedToken = cloudflareEnv?.FEATURE_TOGGLE_TOKEN;

  // Check authorization
  const providedToken = extractToken(request);

  if (!expectedToken || providedToken !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: API_HEADERS,
    });
  }

  const kv = cloudflareEnv?.ANALYTICS_KV;
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
 * Auth: Authorization: Bearer <token> (preferred) or body.token (deprecated)
 * Body: { features: FeatureToggle[] }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // CSRF protection - validate origin header
  if (!validateOrigin(request)) {
    return new Response(JSON.stringify({ error: 'CSRF check failed' }), {
      status: 403,
      headers: API_HEADERS,
    });
  }

  const cloudflareEnv = (locals as App.Locals).runtime?.env;
  const expectedToken = cloudflareEnv?.FEATURE_TOGGLE_TOKEN;

  let body: { token?: string; features?: FeatureToggle[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: API_HEADERS,
    });
  }

  // Check authorization - prefer header, fallback to body token
  const providedToken = extractToken(request) || body.token;
  if (!expectedToken || providedToken !== expectedToken) {
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

  const kv = cloudflareEnv?.ANALYTICS_KV;
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
