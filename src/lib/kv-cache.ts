/**
 * Distributed KV-based cache for AI tool responses
 *
 * Uses Cloudflare KV for persistent, distributed caching across Worker isolates.
 * Falls back to in-memory cache when KV is unavailable.
 */

import { CACHE_CONFIG, hashInput, type CacheEntry } from '../utils/cache';

/**
 * KV cache key prefix to avoid collisions with analytics data
 */
const KV_CACHE_PREFIX = 'cache:';

/**
 * KV cache entry structure (stored as JSON)
 */
interface KVCacheEntry {
  output: string;
  timestamp: number;
}

/**
 * Create a KV-backed cache manager
 *
 * @param kv - Cloudflare KV namespace (optional, falls back to in-memory)
 * @param inMemoryCache - In-memory cache for fallback and read-through caching
 */
export function createKVCacheManager(
  kv: KVNamespace | undefined,
  inMemoryCache: {
    get: (key: string) => CacheEntry | null;
    set: (key: string, output: string) => void;
  }
) {
  /**
   * Check if KV is available
   */
  function isKVAvailable(): boolean {
    return kv !== undefined;
  }

  return {
    /**
     * Get cached entry, checking KV first then in-memory
     */
    async get(cacheKey: string): Promise<CacheEntry | null> {
      // Check in-memory cache first (fastest)
      const memoryEntry = inMemoryCache.get(cacheKey);
      if (memoryEntry) {
        return memoryEntry;
      }

      // Check KV if available
      if (!isKVAvailable()) {
        return null;
      }

      try {
        const kvKey = KV_CACHE_PREFIX + cacheKey;
        const kvData = await kv!.get(kvKey, 'json') as KVCacheEntry | null;

        if (!kvData) {
          return null;
        }

        // Check if expired (KV TTL should handle this, but double-check)
        if (Date.now() - kvData.timestamp > CACHE_CONFIG.TTL_MS) {
          // Don't await delete - fire and forget
          kv!.delete(kvKey).catch(() => {/* ignore */});
          return null;
        }

        // Populate in-memory cache for faster subsequent reads
        inMemoryCache.set(cacheKey, kvData.output);

        return {
          output: kvData.output,
          timestamp: kvData.timestamp,
        };
      } catch (error) {
        // KV errors are non-fatal - fall back to in-memory only
        if (import.meta.env.DEV) {
          console.warn('[kv-cache] KV get failed:', error);
        }
        return null;
      }
    },

    /**
     * Set cache entry in both KV and in-memory
     */
    async set(cacheKey: string, output: string): Promise<void> {
      const timestamp = Date.now();

      // Always set in memory (synchronous, fast)
      inMemoryCache.set(cacheKey, output);

      // Set in KV if available (async, fire-and-forget for performance)
      if (isKVAvailable()) {
        const kvKey = KV_CACHE_PREFIX + cacheKey;
        const entry: KVCacheEntry = { output, timestamp };

        // KV put with expiration (TTL in seconds)
        const expirationTtl = Math.floor(CACHE_CONFIG.TTL_MS / 1000);

        // Fire and forget - don't block on KV write
        kv!.put(kvKey, JSON.stringify(entry), { expirationTtl }).catch((error) => {
          if (import.meta.env.DEV) {
            console.warn('[kv-cache] KV set failed:', error);
          }
        });
      }
    },

    /**
     * Generate cache key from input string
     */
    async generateKey(prefix: string, input: string): Promise<string> {
      return hashInput(`${prefix}:${input}`);
    },

    /**
     * Check if KV storage is available
     */
    isDistributed(): boolean {
      return isKVAvailable();
    },
  };
}

/**
 * Create a KV-backed rate limiter
 *
 * Uses KV for distributed rate limiting across Worker isolates.
 * Falls back to in-memory when KV is unavailable.
 */
export function createKVRateLimiter(
  kv: KVNamespace | undefined,
  inMemoryLimiter: {
    checkAndUpdate: (identifier: string) => boolean;
  }
) {
  const RATE_LIMIT_PREFIX = 'ratelimit:';

  /**
   * Check if KV is available
   */
  function isKVAvailable(): boolean {
    return kv !== undefined;
  }

  return {
    /**
     * Check if request is allowed and update rate limit
     *
     * Note: For simplicity, we use KV as authoritative when available,
     * with in-memory as fallback. This provides better protection against
     * distributed attacks but may be slightly slower.
     */
    async checkAndUpdate(identifier: string): Promise<boolean> {
      // If no KV, use in-memory limiter
      if (!isKVAvailable()) {
        return inMemoryLimiter.checkAndUpdate(identifier);
      }

      const kvKey = RATE_LIMIT_PREFIX + identifier;
      const now = Date.now();
      const windowMs = CACHE_CONFIG.RATE_LIMIT_WINDOW_MS;
      const maxRequests = CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS;

      try {
        // Get current rate limit entry
        const entry = await kv!.get(kvKey, 'json') as { count: number; resetTime: number } | null;

        if (!entry || now > entry.resetTime) {
          // New window - allow request and create entry
          const newEntry = {
            count: 1,
            resetTime: now + windowMs,
          };

          // Set with expiration slightly longer than window to handle clock skew
          const expirationTtl = Math.ceil(windowMs / 1000) + 10;
          await kv!.put(kvKey, JSON.stringify(newEntry), { expirationTtl });
          return true;
        }

        if (entry.count >= maxRequests) {
          // Rate limited
          return false;
        }

        // Increment counter
        entry.count++;
        const remainingMs = entry.resetTime - now;
        const expirationTtl = Math.ceil(remainingMs / 1000) + 10;
        await kv!.put(kvKey, JSON.stringify(entry), { expirationTtl });
        return true;
      } catch (error) {
        // KV errors - fall back to in-memory
        if (import.meta.env.DEV) {
          console.warn('[kv-cache] Rate limit KV error:', error);
        }
        return inMemoryLimiter.checkAndUpdate(identifier);
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
