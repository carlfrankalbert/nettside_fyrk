/**
 * Distributed KV-based cache for AI tool responses
 *
 * Uses Cloudflare KV for persistent, distributed caching across Worker isolates.
 * Falls back to in-memory cache when KV is unavailable.
 */

import { CACHE_CONFIG, hashInput, type CacheEntry } from '../utils/cache';
import type { CircuitBreakerState } from './anthropic-client';

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
 * Uses a hybrid approach to avoid KV read-modify-write race conditions:
 * - In-memory limiter is authoritative (synchronous, race-free within isolate)
 * - KV provides cross-isolate awareness with eventual consistency
 * - Combined limit: both must allow the request
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

/**
 * Daily budget configuration
 * Limits total requests per IP per day to control costs
 */
const DAILY_BUDGET_CONFIG = {
  /** Maximum requests per IP per day */
  MAX_DAILY_REQUESTS: 100,
  /** Budget window in milliseconds (24 hours) */
  WINDOW_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Create a KV-backed daily budget tracker
 *
 * Provides per-IP daily request limits to control API costs.
 * Falls back gracefully when KV is unavailable.
 */
export function createKVDailyBudget(kv: KVNamespace | undefined) {
  const BUDGET_PREFIX = 'budget:';

  function isKVAvailable(): boolean {
    return kv !== undefined;
  }

  return {
    /**
     * Check if request is within daily budget and increment counter
     * @returns true if within budget, false if exceeded
     */
    async checkAndIncrement(identifier: string): Promise<boolean> {
      if (!isKVAvailable()) {
        // No KV = no budget enforcement (fail open)
        return true;
      }

      const kvKey = BUDGET_PREFIX + identifier;
      const now = Date.now();

      try {
        const entry = await kv!.get(kvKey, 'json') as { count: number; resetTime: number } | null;

        if (!entry || now > entry.resetTime) {
          // New day - reset budget
          const newEntry = {
            count: 1,
            resetTime: now + DAILY_BUDGET_CONFIG.WINDOW_MS,
          };
          // TTL slightly longer than window
          const expirationTtl = Math.ceil(DAILY_BUDGET_CONFIG.WINDOW_MS / 1000) + 3600;
          await kv!.put(kvKey, JSON.stringify(newEntry), { expirationTtl });
          return true;
        }

        if (entry.count >= DAILY_BUDGET_CONFIG.MAX_DAILY_REQUESTS) {
          return false;
        }

        // Increment counter
        entry.count++;
        const remainingMs = entry.resetTime - now;
        const expirationTtl = Math.ceil(remainingMs / 1000) + 3600;
        await kv!.put(kvKey, JSON.stringify(entry), { expirationTtl });
        return true;
      } catch {
        // KV errors - fail open to not block users
        return true;
      }
    },

    /**
     * Get remaining budget for an identifier
     */
    async getRemaining(identifier: string): Promise<number> {
      if (!isKVAvailable()) {
        return DAILY_BUDGET_CONFIG.MAX_DAILY_REQUESTS;
      }

      const kvKey = BUDGET_PREFIX + identifier;
      try {
        const entry = await kv!.get(kvKey, 'json') as { count: number; resetTime: number } | null;
        if (!entry || Date.now() > entry.resetTime) {
          return DAILY_BUDGET_CONFIG.MAX_DAILY_REQUESTS;
        }
        return Math.max(0, DAILY_BUDGET_CONFIG.MAX_DAILY_REQUESTS - entry.count);
      } catch {
        return DAILY_BUDGET_CONFIG.MAX_DAILY_REQUESTS;
      }
    },

    isDistributed(): boolean {
      return isKVAvailable();
    },
  };
}

/**
 * KV-backed circuit breaker configuration
 */
const KV_CIRCUIT_BREAKER_CONFIG = {
  FAILURE_THRESHOLD: 5,
  RESET_TIMEOUT_MS: 30000,
} as const;

/**
 * Create a KV-backed circuit breaker for cross-isolate state sharing
 *
 * Uses a hybrid approach for consistent latency:
 * - In-memory breaker is authoritative (synchronous, no blocking)
 * - KV provides cross-isolate awareness with eventual consistency
 * - Both must allow the request (either open = blocked)
 */
export function createKVCircuitBreaker(
  kv: KVNamespace | undefined,
  toolName: string,
  inMemoryBreaker: {
    check: () => boolean;
    recordSuccess: () => void;
    recordFailure: () => void;
    getState: () => CircuitBreakerState;
  }
) {
  const CB_PREFIX = 'circuitbreaker:';
  const kvKey = CB_PREFIX + toolName;

  // Cache KV state locally to avoid blocking on every check
  let cachedKVState: CircuitBreakerState | null = null;
  let lastKVSync = 0;
  const KV_SYNC_INTERVAL_MS = 5000; // Sync every 5 seconds

  function isKVAvailable(): boolean {
    return kv !== undefined;
  }

  function logKVError(operation: string, error: unknown): void {
    if (import.meta.env.DEV) {
      console.warn(`[kv-circuit-breaker] ${operation} failed:`, error);
    }
  }

  return {
    /**
     * Check if circuit is closed (requests allowed)
     *
     * Non-blocking: uses in-memory as primary, syncs KV state in background
     */
    check(): boolean {
      // In-memory is authoritative
      const inMemoryAllowed = inMemoryBreaker.check();
      if (!inMemoryAllowed) {
        return false;
      }

      // Check cached KV state (non-blocking)
      if (cachedKVState?.isOpen) {
        const now = Date.now();
        // Check if we should reset (half-open state)
        if (now - cachedKVState.lastFailure > KV_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS) {
          cachedKVState = null; // Reset cached state
        } else {
          return false; // KV circuit is open
        }
      }

      // Sync KV state in background if stale
      if (isKVAvailable() && Date.now() - lastKVSync > KV_SYNC_INTERVAL_MS) {
        lastKVSync = Date.now();
        kv!.get(kvKey, 'json')
          .then((state) => {
            cachedKVState = state as CircuitBreakerState | null;
          })
          .catch((error) => logKVError('background sync', error));
      }

      return true;
    },

    /**
     * Record a successful request
     */
    recordSuccess(): void {
      inMemoryBreaker.recordSuccess();
      cachedKVState = null; // Clear cached state

      if (!isKVAvailable()) return;

      // Update KV in background (fire-and-forget)
      const newState: CircuitBreakerState = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      };
      kv!.put(kvKey, JSON.stringify(newState), { expirationTtl: 3600 })
        .catch((error) => logKVError('recordSuccess', error));
    },

    /**
     * Record a failed request
     */
    recordFailure(): void {
      inMemoryBreaker.recordFailure();

      if (!isKVAvailable()) return;

      // Update KV in background (fire-and-forget)
      // Read current state, increment, and write back
      kv!.get(kvKey, 'json')
        .then((state) => {
          const currentState = (state as CircuitBreakerState) || { failures: 0, lastFailure: 0, isOpen: false };
          currentState.failures++;
          currentState.lastFailure = Date.now();

          if (currentState.failures >= KV_CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) {
            currentState.isOpen = true;
          }

          // Update cached state
          cachedKVState = currentState;

          return kv!.put(kvKey, JSON.stringify(currentState), { expirationTtl: 3600 });
        })
        .catch((error) => logKVError('recordFailure', error));
    },

    /**
     * Get current state (for monitoring)
     */
    getState(): CircuitBreakerState {
      // Return in-memory state (authoritative)
      return inMemoryBreaker.getState();
    },

    /**
     * Get KV state (for monitoring, async)
     */
    async getKVState(): Promise<CircuitBreakerState> {
      if (!isKVAvailable()) {
        return inMemoryBreaker.getState();
      }

      try {
        const state = await kv!.get(kvKey, 'json') as CircuitBreakerState | null;
        return state || { failures: 0, lastFailure: 0, isOpen: false };
      } catch (error) {
        logKVError('getKVState', error);
        return inMemoryBreaker.getState();
      }
    },

    isDistributed(): boolean {
      return isKVAvailable();
    },
  };
}
