/**
 * KV-backed circuit breaker for cross-isolate state sharing
 *
 * Uses a hybrid approach for consistent latency:
 * - In-memory breaker is authoritative (synchronous, no blocking)
 * - KV provides cross-isolate awareness with eventual consistency
 * - Both must allow the request (either open = blocked)
 */

import type { CircuitBreakerState } from './anthropic-client';

/**
 * KV-backed circuit breaker configuration
 */
const KV_CIRCUIT_BREAKER_CONFIG = {
  FAILURE_THRESHOLD: 5,
  RESET_TIMEOUT_MS: 30000,
} as const;

/**
 * Create a KV-backed circuit breaker for cross-isolate state sharing
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
