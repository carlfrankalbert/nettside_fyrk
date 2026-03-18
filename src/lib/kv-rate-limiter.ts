/**
 * KV-backed rate limiter
 *
 * Uses a hybrid approach to avoid KV read-modify-write race conditions:
 * - In-memory limiter is authoritative (synchronous, race-free within isolate)
 * - KV provides cross-isolate awareness with eventual consistency
 * - Combined limit: both must allow the request
 */

import { CACHE_CONFIG } from '../utils/cache';

/**
 * Create a KV-backed rate limiter
 */
export function createKVRateLimiter(
  kv: KVNamespace | undefined,
  inMemoryLimiter: {
    checkAndUpdate: (identifier: string) => boolean;
  }
) {
  const RATE_LIMIT_PREFIX = 'ratelimit:';

  function isKVAvailable(): boolean {
    return kv !== undefined;
  }

  return {
    /**
     * Check if request is allowed and update rate limit
     *
     * Hybrid approach to handle KV's lack of atomic operations:
     * 1. Check in-memory limiter first (race-free within isolate)
     * 2. If allowed, check KV for cross-isolate limiting
     * 3. Update KV in background (fire-and-forget) to reduce latency
     */
    async checkAndUpdate(identifier: string): Promise<boolean> {
      // Always check in-memory first (authoritative within isolate)
      const inMemoryAllowed = inMemoryLimiter.checkAndUpdate(identifier);
      if (!inMemoryAllowed) {
        return false;
      }

      // If no KV, in-memory decision is final
      if (!isKVAvailable()) {
        return true;
      }

      const kvKey = RATE_LIMIT_PREFIX + identifier;
      const now = Date.now();
      const windowMs = CACHE_CONFIG.RATE_LIMIT_WINDOW_MS;
      // Use slightly lower threshold for KV to account for race conditions
      const kvMaxRequests = Math.floor(CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS * 1.5);

      try {
        // Read KV state for cross-isolate awareness
        const entry = await kv!.get(kvKey, 'json') as { count: number; resetTime: number } | null;

        // Check if over KV threshold (cross-isolate limit)
        if (entry && now <= entry.resetTime && entry.count >= kvMaxRequests) {
          return false;
        }

        // Update KV in background (fire-and-forget to avoid blocking)
        const newCount = (entry && now <= entry.resetTime) ? entry.count + 1 : 1;
        const resetTime = (entry && now <= entry.resetTime) ? entry.resetTime : now + windowMs;
        const expirationTtl = Math.ceil(windowMs / 1000) + 10;

        kv!.put(kvKey, JSON.stringify({ count: newCount, resetTime }), { expirationTtl })
          .catch(() => {/* ignore - non-critical */});

        return true;
      } catch {
        // KV errors - in-memory already allowed, so allow request
        return true;
      }
    },

    /**
     * Check if distributed rate limiting is active
     */
    isDistributed(): boolean {
      return isKVAvailable();
    },
  };
}
