/**
 * Analytics metrics aggregation utilities
 * Extracted from track.ts POST handler for testability
 */


/**
 * Error types for analytics categorization
 */
export type ErrorType = 'timeout' | 'rate_limit' | 'budget_exceeded' | 'validation' | 'api_error' | 'network' | 'unknown';

/**
 * Metadata for events (no PII)
 */
export interface EventMetadata {
  charCount?: number;
  processingTimeMs?: number;
  errorType?: ErrorType;
  cached?: boolean;
  inputLength?: number;
  toolVersion?: string;
}
