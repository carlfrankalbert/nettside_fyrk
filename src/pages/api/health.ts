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
 * Simple per-IP rate limiter for health endpoint (in-memory)
 */
const healthRateLimit = new Map<string, { count: number; resetAt: number }>();

function isHealthRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = healthRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    healthRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 100; // 100 req/min
}

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring.
 * Rate limited. Returns dependency status without exposing sensitive details.
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  if (isHealthRateLimited(ip)) {
    return new Response(
      JSON.stringify({ status: 'rate_limited' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
