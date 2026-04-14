/**
 * Utility functions for common CSS class patterns
 */

/**
 * Combine multiple class strings, filtering out empty values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
