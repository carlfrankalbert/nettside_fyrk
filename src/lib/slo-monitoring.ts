/**
 * SLO Monitoring for AI Tools
 *
 * Tracks key performance indicators:
 * - Error rates (5xx, 4xx)
 * - Request latency (p50, p95, p99)
 * - Cache hit rates
 * - Rate limit hits
 *
 * Uses KV for persistence when available, falls back to in-memory.
 */

import type { ToolName } from './ai-tool-handler';

/**
 * Metric types we track
 */
type MetricType = 'request' | 'error_5xx' | 'error_4xx' | 'cache_hit' | 'cache_miss' | 'rate_limit';

/**
 * Latency bucket thresholds in ms
 */
const LATENCY_BUCKETS = [100, 250, 500, 1000, 2500, 5000, 10000] as const;

/**
 * In-memory metrics storage (per Worker isolate)
 * Aggregated to KV periodically
 */
interface MetricsState {
  counts: Record<MetricType, number>;
  latencies: number[];
  lastFlushTime: number;
}

/**
 * KV metrics structure (stored as JSON)
 */
interface KVMetrics {
  /** ISO date string for the hour */
  hour: string;
  /** Tool version (for before/after comparison) */
  version?: string;
  /** Request counts by type */
  counts: Record<MetricType, number>;
  /** Latency histogram buckets */
  latencyBuckets: Record<string, number>;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Create SLO monitor for a specific tool
 *
 * @param toolName - Tool identifier
 * @param kv - Optional KV namespace for persistence
 * @param version - Optional version string for before/after comparison (e.g., 'v1', 'v2')
 */
export function createSLOMonitor(toolName: ToolName, kv?: KVNamespace, version?: string) {
  const versionSuffix = version ? `:${version}` : '';
  const KV_PREFIX = `slo:${toolName}${versionSuffix}:`;
  const FLUSH_INTERVAL_MS = 60_000; // Flush to KV every minute

  // In-memory state for current Worker isolate
  const state: MetricsState = {
    counts: {
      request: 0,
      error_5xx: 0,
      error_4xx: 0,
      cache_hit: 0,
      cache_miss: 0,
      rate_limit: 0,
    },
    latencies: [],
    lastFlushTime: Date.now(),
  };

  /**
   * Get current hour key for KV storage
   */
  function getHourKey(): string {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }

  /**
   * Calculate latency bucket for histogram
   */
  function getLatencyBucket(latencyMs: number): string {
    for (const bucket of LATENCY_BUCKETS) {
      if (latencyMs <= bucket) {
        return `le_${bucket}`;
      }
    }
    return 'le_inf';
  }

  /**
   * Build latency histogram from latencies array
   */
  function buildLatencyHistogram(latencies: number[]): Record<string, number> {
    const histogram: Record<string, number> = {};

    // Initialize all buckets
    for (const bucket of LATENCY_BUCKETS) {
      histogram[`le_${bucket}`] = 0;
    }
    histogram['le_inf'] = 0;

    // Count latencies into buckets
    for (const latency of latencies) {
      const bucket = getLatencyBucket(latency);
      histogram[bucket] = (histogram[bucket] || 0) + 1;
    }

    return histogram;
  }

  /**
   * Flush in-memory metrics to KV
   */
  async function flushToKV(): Promise<void> {
    if (!kv) return;

    const hourKey = getHourKey();
    const kvKey = KV_PREFIX + hourKey;

    try {
      // Get existing metrics for this hour
      const existing = await kv.get(kvKey, 'json') as KVMetrics | null;

      // Merge with current state
      const newCounts = { ...state.counts };
      const newHistogram = buildLatencyHistogram(state.latencies);

      if (existing) {
        // Add existing counts
        for (const key of Object.keys(newCounts) as MetricType[]) {
          newCounts[key] += existing.counts[key] || 0;
        }
        // Add existing histogram
        for (const bucket of Object.keys(newHistogram)) {
          newHistogram[bucket] += existing.latencyBuckets[bucket] || 0;
        }
      }

      const metrics: KVMetrics = {
        hour: hourKey,
        version,
        counts: newCounts,
        latencyBuckets: newHistogram,
        updatedAt: Date.now(),
      };

      // Store with 24h TTL
      await kv.put(kvKey, JSON.stringify(metrics), {
        expirationTtl: 86400,
      });

      // Reset in-memory state after successful flush
      for (const key of Object.keys(state.counts) as MetricType[]) {
        state.counts[key] = 0;
      }
      state.latencies = [];
      state.lastFlushTime = Date.now();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[slo-monitoring] Flush to KV failed:', error);
      }
    }
  }

  /**
   * Maybe flush metrics if interval has passed
   */
  function maybeFlush(): void {
    if (!kv) return;

    const now = Date.now();
    if (now - state.lastFlushTime >= FLUSH_INTERVAL_MS) {
      // Fire and forget
      flushToKV().catch(() => {/* ignore */});
    }
  }

  return {
    /**
     * Record a request with its outcome
     */
    recordRequest(options: {
      statusCode: number;
      latencyMs: number;
      cached: boolean;
      rateLimited?: boolean;
    }): void {
      const { statusCode, latencyMs, cached, rateLimited = false } = options;

      state.counts.request++;
      state.latencies.push(latencyMs);

      if (rateLimited) {
        state.counts.rate_limit++;
      } else if (statusCode >= 500) {
        state.counts.error_5xx++;
      } else if (statusCode >= 400) {
        state.counts.error_4xx++;
      }

      if (cached) {
        state.counts.cache_hit++;
      } else {
        state.counts.cache_miss++;
      }

      // Probabilistic flush (1% of requests)
      if (Math.random() < 0.01) {
        maybeFlush();
      }
    },

    /**
     * Record an error
     */
    recordError(statusCode: number, latencyMs: number): void {
      state.counts.request++;
      state.latencies.push(latencyMs);

      if (statusCode >= 500) {
        state.counts.error_5xx++;
      } else if (statusCode >= 400) {
        state.counts.error_4xx++;
      }

      state.counts.cache_miss++;
      maybeFlush();
    },

    /**
     * Record rate limit hit
     */
    recordRateLimit(): void {
      state.counts.request++;
      state.counts.rate_limit++;
      maybeFlush();
    },
  };
}
