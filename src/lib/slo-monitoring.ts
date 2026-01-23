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
  /** Request counts by type */
  counts: Record<MetricType, number>;
  /** Latency histogram buckets */
  latencyBuckets: Record<string, number>;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Create SLO monitor for a specific tool
 */
export function createSLOMonitor(toolName: ToolName, kv?: KVNamespace) {
  const KV_PREFIX = `slo:${toolName}:`;
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

    /**
     * Get current metrics snapshot (for health endpoint)
     */
    getSnapshot(): {
      counts: Record<MetricType, number>;
      errorRate5xx: number;
      errorRate4xx: number;
      cacheHitRate: number;
    } {
      const total = state.counts.request || 1; // Avoid division by zero
      const cacheTotal = state.counts.cache_hit + state.counts.cache_miss || 1;

      return {
        counts: { ...state.counts },
        errorRate5xx: state.counts.error_5xx / total,
        errorRate4xx: state.counts.error_4xx / total,
        cacheHitRate: state.counts.cache_hit / cacheTotal,
      };
    },

    /**
     * Force flush metrics to KV
     */
    async flush(): Promise<void> {
      await flushToKV();
    },

    /**
     * Get historical metrics from KV (last N hours)
     */
    async getHistory(hours: number = 24): Promise<KVMetrics[]> {
      if (!kv) return [];

      const results: KVMetrics[] = [];
      const now = new Date();

      for (let i = 0; i < hours; i++) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        date.setMinutes(0, 0, 0);
        const hourKey = date.toISOString();
        const kvKey = KV_PREFIX + hourKey;

        try {
          const metrics = await kv.get(kvKey, 'json') as KVMetrics | null;
          if (metrics) {
            results.push(metrics);
          }
        } catch {
          // Skip failed reads
        }
      }

      return results;
    },
  };
}

/**
 * Calculate SLO metrics from history
 */
export function calculateSLOMetrics(history: KVMetrics[]): {
  totalRequests: number;
  errorRate5xx: number;
  errorRate4xx: number;
  cacheHitRate: number;
  availability: number;
} {
  if (history.length === 0) {
    return {
      totalRequests: 0,
      errorRate5xx: 0,
      errorRate4xx: 0,
      cacheHitRate: 0,
      availability: 1,
    };
  }

  let totalRequests = 0;
  let errors5xx = 0;
  let errors4xx = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const metrics of history) {
    totalRequests += metrics.counts.request || 0;
    errors5xx += metrics.counts.error_5xx || 0;
    errors4xx += metrics.counts.error_4xx || 0;
    cacheHits += metrics.counts.cache_hit || 0;
    cacheMisses += metrics.counts.cache_miss || 0;
  }

  const safeTotal = totalRequests || 1;
  const safeCacheTotal = cacheHits + cacheMisses || 1;

  return {
    totalRequests,
    errorRate5xx: errors5xx / safeTotal,
    errorRate4xx: errors4xx / safeTotal,
    cacheHitRate: cacheHits / safeCacheTotal,
    // Availability = 1 - (5xx errors / total requests)
    availability: 1 - errors5xx / safeTotal,
  };
}
