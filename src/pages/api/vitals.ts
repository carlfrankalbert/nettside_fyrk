import type { APIRoute } from 'astro';

export const prerender = false;

interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

interface VitalsPayload {
  metrics: WebVitalMetric[];
}

// In-memory aggregation (in production, use a proper time-series database)
const vitalsAggregates: Record<string, {
  count: number;
  sum: number;
  good: number;
  needsImprovement: number;
  poor: number;
  p75: number[];
  lastUpdated: number;
}> = {};

// Keep only last 1000 p75 samples per metric
const MAX_P75_SAMPLES = 1000;

/**
 * POST /api/vitals
 * Receives Web Vitals metrics from real users
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json() as VitalsPayload;

    if (!data.metrics || !Array.isArray(data.metrics)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: metrics array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process each metric
    for (const metric of data.metrics) {
      if (!isValidMetric(metric)) continue;

      const key = metric.name;

      if (!vitalsAggregates[key]) {
        vitalsAggregates[key] = {
          count: 0,
          sum: 0,
          good: 0,
          needsImprovement: 0,
          poor: 0,
          p75: [],
          lastUpdated: Date.now(),
        };
      }

      const agg = vitalsAggregates[key];
      agg.count++;
      agg.sum += metric.value;
      agg.lastUpdated = Date.now();

      // Track rating distribution
      if (metric.rating === 'good') agg.good++;
      else if (metric.rating === 'needs-improvement') agg.needsImprovement++;
      else agg.poor++;

      // Track p75 values
      agg.p75.push(metric.value);
      if (agg.p75.length > MAX_P75_SAMPLES) {
        agg.p75.shift();
      }

      // Try to store in KV if available
      const cloudflareEnv = (locals as App.Locals).runtime?.env;
      if (cloudflareEnv?.ANALYTICS_KV) {
        try {
          await storeMetricInKV(cloudflareEnv.ANALYTICS_KV, metric);
        } catch (e) {
          console.error('Failed to store metric in KV:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: data.metrics.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error processing vitals:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to process metrics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/vitals
 * Returns aggregated Web Vitals statistics (protected)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Check for auth token
  const cloudflareEnv = (locals as App.Locals).runtime?.env;
  const statsToken = cloudflareEnv?.STATS_TOKEN;

  if (statsToken) {
    const authHeader = request.headers.get('Authorization');
    const providedToken = authHeader?.replace('Bearer ', '');

    if (providedToken !== statsToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Calculate aggregates
  const summary: Record<string, {
    name: string;
    count: number;
    avg: number;
    p75: number;
    goodPercent: number;
    needsImprovementPercent: number;
    poorPercent: number;
    lastUpdated: string;
  }> = {};

  for (const [name, agg] of Object.entries(vitalsAggregates)) {
    const sorted = [...agg.p75].sort((a, b) => a - b);
    const p75Index = Math.floor(sorted.length * 0.75);

    summary[name] = {
      name,
      count: agg.count,
      avg: agg.count > 0 ? Math.round(agg.sum / agg.count) : 0,
      p75: sorted[p75Index] || 0,
      goodPercent: agg.count > 0 ? Math.round((agg.good / agg.count) * 100) : 0,
      needsImprovementPercent: agg.count > 0 ? Math.round((agg.needsImprovement / agg.count) * 100) : 0,
      poorPercent: agg.count > 0 ? Math.round((agg.poor / agg.count) * 100) : 0,
      lastUpdated: new Date(agg.lastUpdated).toISOString(),
    };
  }

  return new Response(
    JSON.stringify({
      vitals: summary,
      collectionPeriod: {
        start: getOldestTimestamp(),
        end: new Date().toISOString(),
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};

function isValidMetric(metric: unknown): metric is WebVitalMetric {
  if (!metric || typeof metric !== 'object') return false;

  const m = metric as Record<string, unknown>;
  const validNames = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];

  return (
    typeof m.name === 'string' &&
    validNames.includes(m.name) &&
    typeof m.value === 'number' &&
    typeof m.rating === 'string' &&
    ['good', 'needs-improvement', 'poor'].includes(m.rating)
  );
}

async function storeMetricInKV(kv: KVNamespace, metric: WebVitalMetric): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `vitals:${today}:${metric.name}:${metric.id}`;

  await kv.put(key, JSON.stringify(metric), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });
}

function getOldestTimestamp(): string {
  let oldest = Date.now();

  for (const agg of Object.values(vitalsAggregates)) {
    if (agg.lastUpdated < oldest && agg.count > 0) {
      // Approximate start based on when we started collecting
      oldest = agg.lastUpdated - (agg.count * 60000); // Rough estimate
    }
  }

  return new Date(oldest).toISOString();
}
