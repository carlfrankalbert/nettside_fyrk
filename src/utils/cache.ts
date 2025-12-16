/**
 * Shared cache utilities for OKR service
 * Used by both client-side service and server-side API
 */

/**
 * Cache configuration constants
 */
export const CACHE_CONFIG = {
  /** Time-to-live for cache entries (24 hours) */
  TTL_MS: 24 * 60 * 60 * 1000,
  /** Prefix for localStorage cache keys */
  KEY_PREFIX: 'okr_cache_',
  /** Rate limit window duration (1 minute) */
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  /** Maximum requests per rate limit window */
  RATE_LIMIT_MAX_REQUESTS: 10,
} as const;

/**
 * Cache entry structure for server-side in-memory cache
 */
export interface CacheEntry {
  output: string;
  timestamp: number;
}

/**
 * Rate limit entry structure
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * LocalStorage cache entry structure
 */
export interface LocalStorageCacheEntry {
  output: string;
  timestamp: number;
}

/**
 * Generate a SHA-256 hash for cache key generation
 * Works in both browser and Cloudflare Workers environments
 */
export async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a cache entry has expired
 */
export function isCacheExpired(timestamp: number, ttlMs: number = CACHE_CONFIG.TTL_MS): boolean {
  return Date.now() - timestamp > ttlMs;
}

/**
 * Create a cache manager for server-side in-memory caching
 */
export function createServerCacheManager() {
  const cache = new Map<string, CacheEntry>();

  return {
    /**
     * Get a cached entry if it exists and hasn't expired
     */
    get(key: string): CacheEntry | null {
      const entry = cache.get(key);
      if (!entry) return null;

      if (isCacheExpired(entry.timestamp)) {
        cache.delete(key);
        return null;
      }

      return entry;
    },

    /**
     * Set a cache entry
     */
    set(key: string, output: string): void {
      cache.set(key, {
        output,
        timestamp: Date.now(),
      });
    },

    /**
     * Clean up expired cache entries
     */
    cleanup(): void {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_CONFIG.TTL_MS) {
          cache.delete(key);
        }
      }
    },
  };
}

/**
 * Create a rate limiter for server-side request limiting
 */
export function createRateLimiter() {
  const limits = new Map<string, RateLimitEntry>();

  return {
    /**
     * Check if a request is allowed and update the rate limit
     * @returns true if request is allowed, false if rate limited
     */
    checkAndUpdate(identifier: string): boolean {
      const now = Date.now();
      const limit = limits.get(identifier);

      if (!limit || now > limit.resetTime) {
        // Create new rate limit window
        limits.set(identifier, {
          count: 1,
          resetTime: now + CACHE_CONFIG.RATE_LIMIT_WINDOW_MS,
        });
        return true;
      }

      if (limit.count >= CACHE_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        return false;
      }

      limit.count++;
      return true;
    },
  };
}

/**
 * Client-side localStorage cache utilities
 */
export const localStorageCache = {
  /**
   * Get cached result from localStorage
   */
  get(cacheKey: string): string | null {
    try {
      const cached = localStorage.getItem(CACHE_CONFIG.KEY_PREFIX + cacheKey);
      if (!cached) return null;

      const entry: LocalStorageCacheEntry = JSON.parse(cached);
      if (isCacheExpired(entry.timestamp)) {
        localStorage.removeItem(CACHE_CONFIG.KEY_PREFIX + cacheKey);
        return null;
      }

      return entry.output;
    } catch {
      return null;
    }
  },

  /**
   * Save result to localStorage cache
   */
  set(cacheKey: string, output: string): void {
    try {
      const entry: LocalStorageCacheEntry = {
        output,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        CACHE_CONFIG.KEY_PREFIX + cacheKey,
        JSON.stringify(entry)
      );
    } catch (e) {
      console.warn('Failed to cache result:', e);
    }
  },
};
