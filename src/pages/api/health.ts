import type { APIRoute } from 'astro';
import { resolveAnthropicConfig } from '../../lib/anthropic-client';

export const prerender = false;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    api_key: 'ok' | 'missing' | 'error';
    kv_storage: 'ok' | 'unavailable' | 'error';
    rate_limiter: 'ok' | 'high_load' | 'error';
  };
  version?: string;
}

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring.
 * Returns status of critical dependencies without exposing sensitive info.
 */
export const GET: APIRoute = async ({ locals }) => {
  const timestamp = new Date().toISOString();

  const checks: HealthStatus['checks'] = {
    api_key: 'error',
    kv_storage: 'error',
    rate_limiter: 'ok',
  };

  try {
    // Check Anthropic API key is configured
    const { apiKey } = resolveAnthropicConfig(locals as App.Locals);
    checks.api_key = apiKey ? 'ok' : 'missing';
  } catch {
    checks.api_key = 'error';
  }

  try {
    // Check KV storage is available
    const cloudflareEnv = (locals as App.Locals).runtime?.env;
    const kv = cloudflareEnv?.ANALYTICS_KV;

    if (kv) {
      // Quick read test
      await kv.get('health_check_test');
      checks.kv_storage = 'ok';
    } else {
      checks.kv_storage = 'unavailable';
    }
  } catch {
    checks.kv_storage = 'error';
  }

  // Determine overall status
  let status: HealthStatus['status'] = 'healthy';

  if (checks.api_key !== 'ok') {
    status = 'unhealthy';
  } else if (checks.kv_storage !== 'ok') {
    status = 'degraded';
  }

  const health: HealthStatus = {
    status,
    timestamp,
    checks,
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return new Response(JSON.stringify(health), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
