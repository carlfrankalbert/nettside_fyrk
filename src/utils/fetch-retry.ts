/**
 * Fetch with retry logic using exponential backoff
 * Used for non-critical requests like analytics where reliability is desired
 * but blocking the user is not acceptable
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);
  // Add random jitter (0-25% of delay) to prevent thundering herd
  const jitter = cappedDelay * Math.random() * 0.25;
  return cappedDelay + jitter;
}

/**
 * Check if an error is retryable (network errors, 5xx responses)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // Network errors (fetch failed)
    return true;
  }
  return false;
}

/**
 * Check if a response status is retryable
 */
function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx) but not client errors (4xx)
  return status >= 500 && status < 600;
}

/**
 * Fetch with retry logic (fire and forget, non-blocking)
 * Retries failed requests with exponential backoff
 *
 * @param url - The URL to fetch
 * @param init - Fetch init options
 * @param options - Retry options
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // If successful or non-retryable status, return
      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }

      // Retryable status, continue to retry logic
    } catch (error) {
      // If not retryable, give up immediately
      if (!isRetryableError(error)) {
        return null;
      }
    }

    // Don't delay after the last attempt
    if (attempt < opts.maxRetries) {
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  // All retries exhausted
  return null;
}

/**
 * Fire and forget fetch with retry (for analytics)
 * Does not block, retries in background
 */
export function fetchWithRetryFireAndForget(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): void {
  fetchWithRetry(url, init, options)
    .then((response) => {
      // Log failed tracking for debugging (only if all retries exhausted)
      if (response === null) {
        if (import.meta.env?.DEV) console.warn('[Tracking] Request failed after retries:', url);
      }
    })
    .catch(() => {
      // Silently ignore - analytics should never block
    });
}
