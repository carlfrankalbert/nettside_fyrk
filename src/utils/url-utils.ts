/**
 * URL encoding/decoding utilities
 * Handles URL-encoded text detection and safe decoding
 * (addresses iOS Safari bug where copied text can be URL-encoded)
 */

/**
 * Common URL-encoded character patterns that indicate text may be encoded
 * - %20: space
 * - %0A: newline
 * - %0D: carriage return
 * - %C3: UTF-8 multibyte character start
 */
const COMMON_ENCODINGS = ['%20', '%0A', '%0D', '%C3'] as const;

/**
 * Regex pattern to match URL-encoded sequences (%XX where XX is hex)
 */
const URL_ENCODED_PATTERN = /%[0-9A-Fa-f]{2}/;

/**
 * Check if text appears to be URL-encoded
 * Looks for common URL encoding patterns like %20 (space), %0A (newline), etc.
 *
 * @param text - The text to check
 * @returns true if the text appears to be URL-encoded
 */
export function isUrlEncoded(text: string): boolean {
  if (!URL_ENCODED_PATTERN.test(text)) return false;

  // Additional check: common URL-encoded characters that shouldn't appear in normal text
  return COMMON_ENCODINGS.some((enc) => text.includes(enc));
}

/**
 * Safely decode URL-encoded text
 * Falls back to original text if decoding fails
 *
 * @param text - The URL-encoded text to decode
 * @returns The decoded text, or original text if decoding fails
 */
export function safeDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    // If decoding fails (malformed encoding), return original text
    return text;
  }
}

/**
 * Decode text if it appears to be URL-encoded
 * Convenience function that combines isUrlEncoded and safeDecodeURIComponent
 *
 * @param text - The text to potentially decode
 * @returns The decoded text if URL-encoded, otherwise the original text
 */
export function decodeIfUrlEncoded(text: string): string {
  return isUrlEncoded(text) ? safeDecodeURIComponent(text) : text;
}
