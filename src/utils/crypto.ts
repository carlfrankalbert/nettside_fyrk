/**
 * Cryptographic utilities for hashing and secure operations
 */

/**
 * Generate a SHA-256 hash of the input string
 * Normalizes input by trimming and converting to lowercase before hashing
 * Works in both browser and Cloudflare Workers environments
 *
 * @param input - The string to hash
 * @returns Hexadecimal hash string
 */
export async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
