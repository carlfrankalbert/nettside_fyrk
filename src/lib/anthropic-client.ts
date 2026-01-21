/**
 * Shared Anthropic API client utilities
 *
 * Extracted from API routes to eliminate duplication.
 * Used by: okr-sjekken, konseptspeilet, antakelseskart
 */

import { ANTHROPIC_CONFIG, HTTP_HEADERS } from '../utils/constants';

/**
 * Retry configuration for Anthropic API calls
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 5000,
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503, 504],
} as const;

export type RetryConfig = typeof RETRY_CONFIG;

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = RETRY_CONFIG
): number {
  const baseDelay =
    config.INITIAL_DELAY_MS * Math.pow(config.BACKOFF_MULTIPLIER, attempt);
  const jitter = Math.random() * 0.3 * baseDelay;
  return Math.min(baseDelay + jitter, config.MAX_DELAY_MS);
}

/**
 * Check if an HTTP status code is retryable
 */
export function isRetryableStatusCode(
  status: number,
  config: RetryConfig = RETRY_CONFIG
): boolean {
  return (config.RETRYABLE_STATUS_CODES as readonly number[]).includes(status);
}

/**
 * Create standard Anthropic API headers
 */
export function createAnthropicHeaders(
  apiKey: string
): Record<string, string> {
  return {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_CONFIG.VERSION,
  };
}

/**
 * Get client IP from request headers
 * Handles Cloudflare, proxies, and direct connections
 */
export function getClientIP(request: Request): string {
  // Try Cloudflare headers first
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return 'unknown';
}

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  config: RetryConfig = RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= config.MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || !isRetryableStatusCode(response.status, config)) {
        return response;
      }

      lastResponse = response;

      if (attempt >= config.MAX_RETRIES) {
        return response;
      }

      const retryDelay = calculateBackoffDelay(attempt, config);
      console.warn(
        `Anthropic API returned ${response.status}, retrying in ${Math.round(retryDelay)}ms (attempt ${attempt + 1}/${config.MAX_RETRIES})`
      );

      await sleep(retryDelay);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      if (attempt >= config.MAX_RETRIES) {
        throw error;
      }

      const retryDelay = calculateBackoffDelay(attempt, config);
      console.warn(
        `Anthropic API request failed, retrying in ${Math.round(retryDelay)}ms (attempt ${attempt + 1}/${config.MAX_RETRIES})`
      );

      await sleep(retryDelay);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('Unknown error during fetch retry');
}

/**
 * Create Anthropic API request body
 */
export function createAnthropicRequestBody(
  systemPrompt: string,
  userMessage: string,
  model: string,
  stream: boolean,
  maxTokens: number = ANTHROPIC_CONFIG.MAX_TOKENS
) {
  return {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    stream,
  };
}

/**
 * Resolve API key and model from Cloudflare env or import.meta.env
 */
export function resolveAnthropicConfig(locals: App.Locals): {
  apiKey: string | undefined;
  model: string;
} {
  const cloudflareEnv = locals.runtime?.env;
  const apiKey =
    cloudflareEnv?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
  const model =
    cloudflareEnv?.ANTHROPIC_MODEL ||
    import.meta.env.ANTHROPIC_MODEL ||
    ANTHROPIC_CONFIG.DEFAULT_MODEL;

  return { apiKey, model };
}

/**
 * Simple circuit breaker for API resilience
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
};

export function createCircuitBreaker(
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
) {
  const state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  };

  return {
    check(): boolean {
      if (!state.isOpen) return true;

      // Check if we should reset (half-open state)
      if (Date.now() - state.lastFailure > config.resetTimeoutMs) {
        state.isOpen = false;
        state.failures = 0;
        return true;
      }

      return false;
    },

    recordSuccess(): void {
      state.failures = 0;
      state.isOpen = false;
    },

    recordFailure(): void {
      state.failures++;
      state.lastFailure = Date.now();
      if (state.failures >= config.failureThreshold) {
        state.isOpen = true;
        console.warn(
          `Circuit breaker opened after ${state.failures} failures`
        );
      }
    },

    getState(): CircuitBreakerState {
      return { ...state };
    },
  };
}
