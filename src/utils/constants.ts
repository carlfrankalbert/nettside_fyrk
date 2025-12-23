/**
 * Shared constants for the application
 * Centralizes error messages, element IDs, and other magic strings
 */

/**
 * Error messages in Norwegian (bokmål)
 */
export const ERROR_MESSAGES = {
  /** Default error message for OKR review failures */
  OKR_REVIEW_DEFAULT: 'Noe gikk galt under vurderingen. Prøv igjen om litt.',
  /** Rate limit error message */
  RATE_LIMIT: 'For mange forespørsler. Vent litt før du prøver igjen.',
  /** Rate limit exceeded (API response) */
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  /** Missing input error message */
  MISSING_INPUT: 'Vennligst skriv inn et OKR-sett for vurdering.',
  /** Missing input (API response) */
  MISSING_INPUT_API: 'Missing input',
  /** Server configuration error */
  SERVER_NOT_CONFIGURED: 'Server not configured: Missing API key',
  /** Streaming failed error */
  STREAMING_FAILED: 'Streaming failed',
  /** API error fallback */
  API_ERROR: 'API error',
  /** Failed to evaluate OKR */
  FAILED_TO_EVALUATE: 'Failed to evaluate OKR',
  /** Unknown error */
  UNKNOWN_ERROR: 'Unknown error',
} as const;

/**
 * Element IDs used in the application
 * Ensures consistency between HTML and JavaScript
 */
export const ELEMENT_IDS = {
  /** Mobile menu button */
  MOBILE_MENU_BUTTON: 'mobile-menu-btn',
  /** Mobile menu container */
  MOBILE_MENU: 'mobile-menu',
  /** Main content area */
  MAIN: 'main',
  /** OKR input textarea */
  OKR_INPUT: 'okr-input',
  /** OKR output container */
  OKR_OUTPUT: 'okr-output',
  /** OKR submit button */
  OKR_SUBMIT: 'okr-submit',
} as const;

/**
 * API routes
 */
export const API_ROUTES = {
  /** OKR review API endpoint */
  OKR_REVIEW: '/api/okr-sjekken',
} as const;

/**
 * Page routes
 */
export const PAGE_ROUTES = {
  HOME: '/',
  OKR_REVIEWER: '/okr-sjekken',
  SPLASH: '/splash',
} as const;

/**
 * Input validation constants
 */
export const INPUT_VALIDATION = {
  /** Minimum input length in characters */
  MIN_LENGTH: 20,
  /** Maximum input length in characters */
  MAX_LENGTH: 2000,
} as const;

/**
 * Anthropic API configuration
 */
export const ANTHROPIC_CONFIG = {
  /** API endpoint */
  API_URL: 'https://api.anthropic.com/v1/messages',
  /** API version */
  VERSION: '2023-06-01',
  /** Default model */
  DEFAULT_MODEL: 'claude-sonnet-4-5-20250929',
  /** Max tokens for response */
  MAX_TOKENS: 1500,
  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 30000,
} as const;

/**
 * HTTP headers
 */
export const HTTP_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_SSE: 'text/event-stream',
  CACHE_CONTROL_NO_CACHE: 'no-cache',
  CONNECTION_KEEP_ALIVE: 'keep-alive',
} as const;

/**
 * Cache header values
 */
export const CACHE_HEADERS = {
  HIT: 'HIT',
  MISS: 'MISS',
} as const;
