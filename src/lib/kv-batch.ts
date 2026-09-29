/**
 * Bulk KV reads for the analytics dashboard.
 *
 * A Worker invocation may make at most 1,000 KV operations. The dashboard fans
 * out over (items × days), which passed that limit for 30-day views when every
 * key was its own `get`. A bulk `get` of up to 100 keys counts as one operation.
 */

/** Cloudflare's cap on keys per bulk `get` */
export const KV_BULK_GET_MAX = 100;

/**
 * Read many keys, 100 per bulk call, all calls in parallel.
 * Every requested key is in the result; missing keys map to null.
 */
export async function getMany(kv: KVNamespace, keys: readonly string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(keys)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += KV_BULK_GET_MAX) {
    chunks.push(unique.slice(i, i + KV_BULK_GET_MAX));
  }

  const results = await Promise.all(chunks.map((chunk) => kv.get(chunk, 'text')));
  const values = new Map<string, string | null>(unique.map((key) => [key, null]));
  for (const result of results) {
    for (const [key, value] of result) values.set(key, value);
  }
  return values;
}

/** A stored counter as a number; missing or garbage values count as 0 */
export function parseCount(value: string | null | undefined): number {
  return parseInt(value || '0', 10) || 0;
}

/** A stored JSON value, or `fallback` when missing or corrupt */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** A stored visitor-hash set (JSON array of strings); anything else is empty */
export function parseHashes(value: string | null | undefined): string[] {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string') : [];
}
