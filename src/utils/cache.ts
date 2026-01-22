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
  /** Maximum number of cache entries (prevents memory issues) */
  MAX_CACHE_ENTRIES: 500,
  /** Maximum rate limit entries to track */
  MAX_RATE_LIMIT_ENTRIES: 1000,
  /** Maximum number of localStorage cache entries (prevents quota exhaustion) */
  MAX_LOCAL_STORAGE_ENTRIES: 50,
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
 * Includes size limits to prevent memory issues
 */
export function createServerCacheManager() {
  const cache = new Map<string, CacheEntry>();

  /**
   * Evict oldest entries when cache exceeds max size
   */
  function evictOldestEntries(): void {
    if (cache.size <= CACHE_CONFIG.MAX_CACHE_ENTRIES) return;

    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    // Remove oldest entries until we're under the limit
    const toRemove = cache.size - CACHE_CONFIG.MAX_CACHE_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }

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
     * Set a cache entry (with size limit enforcement)
     */
    set(key: string, output: string): void {
      // Evict old entries before adding new one
      evictOldestEntries();

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

    /**
     * Get current cache size (for monitoring)
     */
    size(): number {
      return cache.size;
    },
  };
}

/**
 * Create a rate limiter for server-side request limiting
 * Includes size limits to prevent memory issues
 */
export function createRateLimiter() {
  const limits = new Map<string, RateLimitEntry>();

  /**
   * Clean up expired rate limit entries and enforce size limit
   */
  function cleanup(): void {
    const now = Date.now();

    // Remove expired entries first
    for (const [key, entry] of limits.entries()) {
      if (now > entry.resetTime) {
        limits.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (limits.size > CACHE_CONFIG.MAX_RATE_LIMIT_ENTRIES) {
      const entries = Array.from(limits.entries()).sort(
        ([, a], [, b]) => a.resetTime - b.resetTime
      );
      const toRemove = limits.size - CACHE_CONFIG.MAX_RATE_LIMIT_ENTRIES;
      for (let i = 0; i < toRemove; i++) {
        limits.delete(entries[i][0]);
      }
    }
  }

  return {
    /**
     * Check if a request is allowed and update the rate limit
     * @returns true if request is allowed, false if rate limited
     */
    checkAndUpdate(identifier: string): boolean {
      const now = Date.now();
      const limit = limits.get(identifier);

      // Probabilistic cleanup on every request (1% chance) to prevent memory buildup
      // This runs before size check to spread cleanup load and prevent burst scenarios
      if (Math.random() < 0.01) {
        cleanup();
      }

      if (!limit || now > limit.resetTime) {
        // Additional cleanup when approaching capacity
        if (limits.size > CACHE_CONFIG.MAX_RATE_LIMIT_ENTRIES * 0.9) {
          cleanup();
        }

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

    /**
     * Get current number of tracked IPs (for monitoring)
     */
    size(): number {
      return limits.size;
    },
  };
}

/**
 * Check if localStorage is available (handles private browsing, SecurityError)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log storage errors in development mode
 */
function logStorageError(operation: string, error: unknown): void {
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    console.warn(`[localStorage] ${operation} failed:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Client-side localStorage cache utilities
 * Gracefully handles private browsing mode and quota errors
 */
export const localStorageCache = {
  /** Whether localStorage is available (cached check) */
  _available: null as boolean | null,

  /**
   * Check if localStorage is available (cached)
   */
  _isAvailable(): boolean {
    if (this._available === null) {
      this._available = isLocalStorageAvailable();
    }
    return this._available;
  },

  /**
   * Get all cache keys from localStorage
   */
  _getCacheKeys(): string[] {
    if (!this._isAvailable()) return [];

    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
          keys.push(key);
        }
      }
    } catch (error) {
      logStorageError('_getCacheKeys', error);
    }
    return keys;
  },

  /**
   * Evict oldest entries to stay under the size limit
   */
  _evictOldestEntries(): void {
    try {
      const keys = this._getCacheKeys();
      if (keys.length < CACHE_CONFIG.MAX_LOCAL_STORAGE_ENTRIES) return;

      // Get all entries with their timestamps
      const entries: { key: string; timestamp: number }[] = [];
      for (const key of keys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const entry: LocalStorageCacheEntry = JSON.parse(cached);
            entries.push({ key, timestamp: entry.timestamp });
          } catch {
            // Invalid entry, mark for removal
            entries.push({ key, timestamp: 0 });
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries until under limit (keep some buffer)
      const toRemove = entries.length - CACHE_CONFIG.MAX_LOCAL_STORAGE_ENTRIES + 5;
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch {
      // Ignore errors during eviction
    }
  },

  /**
   * Get cached result from localStorage
   */
  get(cacheKey: string): string | null {
    if (!this._isAvailable()) return null;

    try {
      const cached = localStorage.getItem(CACHE_CONFIG.KEY_PREFIX + cacheKey);
      if (!cached) return null;

      const entry: LocalStorageCacheEntry = JSON.parse(cached);
      if (isCacheExpired(entry.timestamp)) {
        localStorage.removeItem(CACHE_CONFIG.KEY_PREFIX + cacheKey);
        return null;
      }

      return entry.output;
    } catch (error) {
      logStorageError('get', error);
      return null;
    }
  },

  /**
   * Save result to localStorage cache (with size limit enforcement)
   */
  set(cacheKey: string, output: string): void {
    if (!this._isAvailable()) return;

    try {
      // Evict old entries before adding new one
      this._evictOldestEntries();

      const entry: LocalStorageCacheEntry = {
        output,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        CACHE_CONFIG.KEY_PREFIX + cacheKey,
        JSON.stringify(entry)
      );
    } catch (error) {
      // If we hit quota, try to evict more aggressively
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this._evictOldestEntries();
        try {
          const entry: LocalStorageCacheEntry = {
            output,
            timestamp: Date.now(),
          };
          localStorage.setItem(
            CACHE_CONFIG.KEY_PREFIX + cacheKey,
            JSON.stringify(entry)
          );
        } catch (retryError) {
          logStorageError('set (retry)', retryError);
        }
      } else {
        logStorageError('set', error);
      }
    }
  },

  /**
   * Remove a specific entry from localStorage cache
   */
  remove(cacheKey: string): void {
    if (!this._isAvailable()) return;

    try {
      localStorage.removeItem(CACHE_CONFIG.KEY_PREFIX + cacheKey);
    } catch (error) {
      logStorageError('remove', error);
    }
  },

  /**
   * Get current number of cache entries
   */
  size(): number {
    return this._getCacheKeys().length;
  },
};
