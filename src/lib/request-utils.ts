/**
 * Request utilities for API handlers
 */

/**
 * Generate a unique request ID using crypto API
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
