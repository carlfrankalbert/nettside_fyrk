/**
 * Centralized error messages and user-facing strings
 * All messages are in Norwegian (Bokmål) for consistency
 */

export const ERROR_MESSAGES = {
  /** Generic error when OKR review fails */
  OKR_REVIEW_FAILED: 'Noe gikk galt under vurderingen. Prøv igjen om litt.',

  /** Rate limit exceeded error */
  RATE_LIMIT_EXCEEDED: 'For mange forespørsler. Vent litt før du prøver igjen.',

  /** Missing input validation error */
  MISSING_INPUT: 'Lim inn OKR først.',

  /** Streaming failed error */
  STREAMING_FAILED: 'Streaming feilet. Prøv igjen.',

  /** API key not configured error (internal) */
  API_KEY_MISSING: 'Server not configured: Missing API key',

  /** Generic API error prefix */
  API_ERROR: 'API error',
} as const;

export const API_ERRORS = {
  /** Missing input in request body */
  MISSING_INPUT: 'Missing input',

  /** Rate limit exceeded */
  RATE_LIMIT: 'Rate limit exceeded',

  /** Retry after header message */
  RETRY_AFTER: 'Please wait a moment before trying again',

  /** Failed to evaluate OKR */
  EVALUATION_FAILED: 'Failed to evaluate OKR',

  /** Generic API error */
  API_ERROR: 'API error',

  /** API key not configured */
  API_KEY_MISSING: 'Server not configured: Missing API key',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type ApiErrorKey = keyof typeof API_ERRORS;
