/**
 * KV-backed daily budget tracker
 *
 * Provides per-IP daily request limits to control API costs.
 * Falls back gracefully when KV is unavailable.
 */

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
