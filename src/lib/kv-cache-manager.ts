/**
 * KV-backed cache manager for AI tool responses
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
