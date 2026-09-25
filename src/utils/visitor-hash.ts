/**
 * Cookieless visitor counting for aggregate analytics.
 *
 * A visitor is identified per day by hash(daily salt + IP + user agent). The salt
 * is random, lives only in KV and expires after two days, so hashes cannot be
 * linked across days or reversed once the salt is gone. Nothing is stored on or
 * read from the visitor's device.
 */

import { ANALYTICS_CONFIG } from './constants';

const SALT_TTL_SECONDS = 2 * 24 * 60 * 60;

/** Upper bound for a daily visitor set, to keep KV values small */
export const MAX_VISITORS_PER_SET = 10_000;

/** Per-isolate cache so the salt is read from KV at most once per day */
let cachedSalt: { dateKey: string; salt: string } | null = null;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getDailySalt(kv: KVNamespace, dateKey: string): Promise<string> {
  if (cachedSalt?.dateKey === dateKey) return cachedSalt.salt;

  const key = `visitor_salt:${dateKey}`;
  let salt = await kv.get(key);
  if (!salt) {
    // Two isolates may race here on the first request of the day; the loser's
    // salt is overwritten and a handful of visitors are counted twice. Accepted.
    salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
    await kv.put(key, salt, { expirationTtl: SALT_TTL_SECONDS });
  }

  cachedSalt = { dateKey, salt };
  return salt;
}

/**
 * Anonymous per-day visitor hash for a request (16 hex chars).
 */
export async function getVisitorHash(
  request: Request,
  kv: KVNamespace,
  dateKey: string,
): Promise<string> {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const salt = await getDailySalt(kv, dateKey);

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}|${ip}|${userAgent}`),
  );
  return toHex(digest).slice(0, 16);
}

/**
 * Add a visitor hash to a daily set stored as a JSON array.
 * Returns true when the hash was not in the set (a new visitor).
 * Once the set is full, new hashes are reported as new but not stored.
 */
export async function addToVisitorSet(
  kv: KVNamespace,
  key: string,
  visitorHash: string,
): Promise<boolean> {
  const json = await kv.get(key);
  let visitors: string[];
  try {
    visitors = json ? JSON.parse(json) : [];
  } catch {
    visitors = [];
  }

  if (visitors.includes(visitorHash)) return false;

  if (visitors.length < MAX_VISITORS_PER_SET) {
    visitors.push(visitorHash);
    await kv.put(key, JSON.stringify(visitors), {
      expirationTtl: ANALYTICS_CONFIG.KV_EXPIRATION_TTL,
    });
  }
  return true;
}

/** Test hook: forget the cached salt */
export function resetVisitorSaltCache(): void {
  cachedSalt = null;
}
