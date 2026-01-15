/**
 * URL decoding utilities for handling pasted content
 * Shared across streaming form components
 */

/**
 * Check if text appears to be URL-encoded
 * Detects common URL encoding patterns like %20 (space), %0A (newline), etc.
 */
export function isUrlEncoded(text: string): boolean {
  const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
  if (!urlEncodedPattern.test(text)) return false;
  const commonEncodings = ['%20', '%0A', '%0D', '%C3'];
  return commonEncodings.some((enc) => text.includes(enc));
}

/**
 * Safely decode URL-encoded text
 * Returns original text if decoding fails
 */
export function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
