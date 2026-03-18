/**
 * Standardized error response factories for AI tool handlers
 */

import { ERROR_MESSAGES, HTTP_HEADERS } from '../utils/constants';

/**
 * Create rate limit response
 */
export function createRateLimitResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '60',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      details: 'Vent litt før du prøver igjen',
    }),
    { status: 429, headers }
  );
}

/**
 * Create circuit breaker response
 */
export function createCircuitBreakerResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '30',
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      details: 'Vent litt før du prøver igjen',
    }),
    { status: 503, headers }
  );
}

/**
 * Create daily budget exceeded response
 */
export function createDailyBudgetResponse(requestId?: string): Response {
  const headers: Record<string, string> = {
    'Content-Type': HTTP_HEADERS.CONTENT_TYPE_JSON,
    'Retry-After': '3600', // 1 hour
  };
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  return new Response(
    JSON.stringify({
      error: 'Daglig grense nådd',
      details: 'Du har brukt opp din daglige kvote. Prøv igjen i morgen.',
    }),
    { status: 429, headers }
  );
}
