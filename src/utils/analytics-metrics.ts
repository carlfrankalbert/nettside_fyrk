/**
 * Analytics metrics aggregation utilities
 * Extracted from track.ts POST handler for testability
 */

import { ANALYTICS_CONFIG } from './constants';

/**
 * Error types for analytics categorization
 */
export type ErrorType = 'timeout' | 'rate_limit' | 'budget_exceeded' | 'validation' | 'api_error' | 'network' | 'unknown';

/**
 * Metadata for events (no PII)
 */
export interface EventMetadata {
  charCount?: number;
  processingTimeMs?: number;
  errorType?: ErrorType;
  cached?: boolean;
  inputLength?: number;
  toolVersion?: string;
  sessionId?: string;
}

/**
 * Aggregated metrics structure stored in KV
 */
export interface AggregatedMetrics {
  count: number;
  totalCharCount: number;
  totalProcessingTimeMs: number;
  cachedCount: number;
  freshCount: number;
  errorTypes: Record<string, number>;
  /** Estimated unique session count (not exact, uses hash-based deduplication) */
  uniqueSessionCount: number;
  /** Hash prefixes for deduplication (limited to 256 buckets for O(1) lookup) */
  sessionHashBuckets: Record<string, boolean>;
  /** Hourly distribution (0-23 UTC hours) */
  hourlyDistribution: Record<string, number>;
}

/**
 * Create an empty metrics object
 */
export function emptyMetrics(): AggregatedMetrics {
  return {
    count: 0,
    totalCharCount: 0,
    totalProcessingTimeMs: 0,
    cachedCount: 0,
    freshCount: 0,
    errorTypes: {},
    uniqueSessionCount: 0,
    sessionHashBuckets: {},
    hourlyDistribution: {},
  };
}

/**
 * Aggregate event metrics into KV storage.
 * Reads existing metrics, merges new data, and writes back.
 */
export async function aggregateEventMetrics(
  kv: KVNamespace,
  buttonId: string,
  dateKey: string,
  metadata: EventMetadata,
  timestamp: number,
): Promise<void> {
  const metricsKey = `metrics:${buttonId}:${dateKey}`;
  const existingMetricsJson = await kv.get(metricsKey);
  let metrics = emptyMetrics();

  try {
    if (existingMetricsJson) {
      const parsed = JSON.parse(existingMetricsJson);
      metrics = {
        ...metrics,
        ...parsed,
      };
      // Migrate old uniqueSessions array to count (backwards compat)
      if (parsed.uniqueSessions && Array.isArray(parsed.uniqueSessions)) {
        metrics.uniqueSessionCount = Math.max(
          metrics.uniqueSessionCount || 0,
          parsed.uniqueSessions.length,
        );
      }
      // Ensure new fields exist
      if (!metrics.sessionHashBuckets) metrics.sessionHashBuckets = {};
      if (!metrics.hourlyDistribution) metrics.hourlyDistribution = {};
      if (!metrics.errorTypes) metrics.errorTypes = {};
    }
  } catch {
    // Reset if parsing fails
  }

  metrics.count += 1;
  if (metadata.charCount) {
    metrics.totalCharCount += metadata.charCount;
  }
  if (metadata.processingTimeMs) {
    metrics.totalProcessingTimeMs += metadata.processingTimeMs;
  }
  if (metadata.cached === true) {
    metrics.cachedCount += 1;
  } else if (metadata.cached === false) {
    metrics.freshCount += 1;
  }
  if (metadata.errorType) {
    metrics.errorTypes[metadata.errorType] = (metrics.errorTypes[metadata.errorType] || 0) + 1;
  }

  // Track unique sessions using hash buckets (constant memory, ~256 entries max)
  if (metadata.sessionId) {
    const hashBucket = metadata.sessionId.slice(0, 2);
    if (!metrics.sessionHashBuckets[hashBucket]) {
      metrics.sessionHashBuckets[hashBucket] = true;
      metrics.uniqueSessionCount += 1;
    }
  }

  // Track hourly distribution (UTC hours 0-23)
  const utcHour = String(new Date(timestamp).getUTCHours());
  metrics.hourlyDistribution[utcHour] = (metrics.hourlyDistribution[utcHour] || 0) + 1;

  await kv.put(metricsKey, JSON.stringify(metrics), {
    expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
  });
}
