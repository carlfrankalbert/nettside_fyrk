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
  /** Request timeout error */
  TIMEOUT: 'Forespørselen tok for lang tid. Prøv igjen.',
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
  MOBILE_MENU_BUTTON: 'mobile-menu-button',
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
  /** Konseptspeil API endpoint */
  KONSEPTSPEIL: '/api/konseptspeilet',
  /** Pre-Mortem Brief API endpoint */
  PRE_MORTEM: '/api/pre-mortem',
} as const;

/**
 * Page routes
 */
export const PAGE_ROUTES = {
  HOME: '/',
  OKR_REVIEWER: '/okr-sjekken',
  KONSEPTSPEIL: '/konseptspeilet',
  ANTAKELSESKART: '/antakelseskart',
  BESLUTNINGSLOGG: '/beslutningslogg',
  PRE_MORTEM: '/verktoy/pre-mortem',
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
 * Pre-Mortem Brief input validation
 * Higher limits due to multiple structured fields
 */
export const PRE_MORTEM_VALIDATION = {
  /** Maximum total input length */
  MAX_TOTAL_LENGTH: 5000,
  /** Minimum decision description length */
  MIN_DECISION_LENGTH: 30,
  /** Maximum decision description length */
  MAX_DECISION_LENGTH: 1000,
  /** Minimum context length */
  MIN_CONTEXT_LENGTH: 20,
  /** Maximum context length */
  MAX_CONTEXT_LENGTH: 1500,
} as const;

/**
 * Streaming form constants
 * Shared across streaming AI tool components
 */
export const STREAMING_CONSTANTS = {
  /** Minimum characters required for submit button to be enabled */
  SUBMIT_THRESHOLD: 50,
  /** Hard timeout for streaming requests (ms) - aborts request */
  HARD_TIMEOUT_MS: 45000,
  /** Hard timeout for Pre-Mortem Brief (ms) - longer due to extensive output */
  PRE_MORTEM_TIMEOUT_MS: 90000,
  /** Interval for rotating loader messages (ms) */
  LOADER_MESSAGE_INTERVAL_MS: 2000,
  /** Threshold for showing "slow request" indicator (ms) */
  SLOW_THRESHOLD_MS: 8000,
} as const;

/**
 * Error types for streaming form components
 */
export type StreamingErrorType = 'timeout' | 'network' | 'invalid_output' | 'validation' | 'unknown' | null;

/**
 * Anthropic API configuration
 *
 * Timeout coordination:
 * - Server timeout (REQUEST_TIMEOUT_MS): 30s - abort Anthropic API call
 * - With retries (up to 2): total max ~40s (30s + backoff delays)
 * - Client hard timeout: should be > server timeout to receive proper error response
 * - Cloudflare Workers CPU limit: 50ms (doesn't apply to I/O wait)
 */
export const ANTHROPIC_CONFIG = {
  /** API endpoint */
  API_URL: 'https://api.anthropic.com/v1/messages',
  /** API version */
  VERSION: '2023-06-01',
  /** Default model */
  DEFAULT_MODEL: 'claude-sonnet-4-5-20250929',
  /** Max tokens for response */
  MAX_TOKENS: 4096,
  /** Request timeout in milliseconds (per attempt, before retries) */
  REQUEST_TIMEOUT_MS: 30000,
  /** Extended timeout for Pre-Mortem Brief (generates more content) */
  PRE_MORTEM_REQUEST_TIMEOUT_MS: 60000,
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

/**
 * Cache key prefixes for AI tools
 * Versioned to allow cache invalidation when prompts change
 */
export const CACHE_KEY_PREFIXES = {
  OKR: 'okr:v1',
  KONSEPTSPEIL: 'konseptspeil:v2',
  ANTAKELSESKART: 'antakelseskart:v1',
  PRE_MORTEM: 'premortem:v1',
} as const;

/**
 * Example text for Konseptspeilet
 * Centralized to ensure consistency across UI
 */
export const EXAMPLE_KONSEPT = `Vi vurderer å teste et enkelt, avgrenset refleksjonsverktøy for produktteam som ofte opplever at beslutninger tas på magefølelse eller basert på ufullstendig informasjon.

Tanken er at verktøyet brukes tidlig i en beslutningsprosess, før man har låst seg til en løsning. Brukeren beskriver kort hva som vurderes, hvorfor det er viktig nå, og hva som oppleves uklart. Verktøyet returnerer et strukturert speil som tydeliggjør hva som er eksplisitt sagt, hvilke antakelser som ligger implisitt i teksten, og hvilke spørsmål som ikke er besvart.

Vi antar at produktledere og team vil ha nytte av å stoppe opp og tenke mer strukturert før større prioriteringer eller investeringer. Målgruppen er erfarne produktledere i kunnskapsorganisasjoner som allerede jobber smidig, men som mangler et enkelt verktøy for å gjøre antakelser synlige.

I første omgang er dette ment som et frivillig pilotverktøy for egen bruk og et lite nettverk, uten ambisjon om kommersialisering. Bruk vil være anonymt, uten innlogging eller lagring. Videre utvikling vurderes basert på faktisk bruk og tilbakemeldinger fra pilotdeltakere.` as const;
