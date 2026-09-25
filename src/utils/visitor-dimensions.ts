/**
 * Aggregate visitor dimensions for /stats: country, network organisation,
 * device class and browser family, plus paths that hit the 404 page.
 *
 * Everything is derived server-side from the request (Cloudflare's `request.cf`
 * and the User-Agent header) and stored only as counts, never per visitor.
 * Nothing is read from or stored on the visitor's device.
 */

import { incrementField } from './acquisition';
import { ANALYTICS_CONFIG } from './constants';

/** Cap per field so spoofed or long-tail values can't grow a KV value unbounded */
export const MAX_DIMENSION_ENTRIES = 300;

export interface AudienceData {
  countries: Record<string, number>;
  organizations: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
}

/** The subset of Cloudflare's request.cf we use */
export interface RequestGeo {
  country?: string;
  asOrganization?: string;
}

export function emptyAudienceData(): AudienceData {
  return { countries: {}, organizations: {}, devices: {}, browsers: {} };
}

export function mergeCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] || 0) + count;
  }
}

export function mergeAudienceData(target: AudienceData, source: Partial<AudienceData>): void {
  for (const field of ['countries', 'organizations', 'devices', 'browsers'] as const) {
    mergeCounts(target[field], source[field] ?? {});
  }
}

export function classifyDevice(userAgent: string): string {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'Nettbrett';
  if (/Mobi|iPhone|Android/i.test(userAgent)) return 'Mobil';
  return 'Desktop';
}

export function classifyBrowser(userAgent: string): string {
  if (/Edg(A|iOS)?\//.test(userAgent)) return 'Edge';
  if (/OPR\/|Opera/.test(userAgent)) return 'Opera';
  if (/SamsungBrowser/.test(userAgent)) return 'Samsung Internet';
  if (/Firefox|FxiOS/.test(userAgent)) return 'Firefox';
  if (/Chrome|CriOS/.test(userAgent)) return 'Chrome';
  if (/Safari/.test(userAgent)) return 'Safari';
  return 'Annet';
}

/** ISO 3166-1 alpha-2 only; drops Cloudflare's XX (unknown) and T1 (Tor) */
export function sanitizeCountry(value: string | undefined): string | undefined {
  if (!value || !/^[A-Z]{2}$/.test(value) || value === 'XX') return undefined;
  return value;
}

export function sanitizeOrganization(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[^\p{L}\p{N} .,&'()/-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return cleaned || undefined;
}

/** Path only (no query or fragment), limited to URL-safe characters */
export function sanitizeNotFoundPath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith('/')) return undefined;
  const path = value.split(/[?#]/)[0].replace(/[^A-Za-z0-9/._~%-]/g, '').slice(0, 150);
  return path.length > 1 ? path : undefined;
}

/**
 * Count one visitor's dimensions for the day and in the all-time total.
 * Call once per unique visitor per day.
 */
export async function recordAudience(
  kv: KVNamespace,
  dateKey: string,
  geo: RequestGeo | undefined,
  userAgent: string,
): Promise<void> {
  const values = {
    countries: sanitizeCountry(geo?.country),
    organizations: sanitizeOrganization(geo?.asOrganization),
    devices: classifyDevice(userAgent),
    browsers: classifyBrowser(userAgent),
  };

  const bump = (data: AudienceData) => {
    for (const [field, value] of Object.entries(values)) {
      incrementField(data[field as keyof AudienceData], value, MAX_DIMENSION_ENTRIES);
    }
  };
  await Promise.all([
    updateJson(kv, `audience:${dateKey}`, emptyAudienceData, bump, ANALYTICS_CONFIG.KV_EXPIRATION_TTL),
    updateJson(kv, 'audience_total', emptyAudienceData, bump),
  ]);
}

/** Count a hit on the 404 page for the day and in the all-time total */
export async function recordNotFound(kv: KVNamespace, dateKey: string, rawPath: string | undefined): Promise<void> {
  const path = sanitizeNotFoundPath(rawPath);
  if (!path) return;

  const bump = (data: Record<string, number>) => incrementField(data, path, MAX_DIMENSION_ENTRIES);
  await Promise.all([
    updateJson(kv, `notfound:${dateKey}`, () => ({}), bump, ANALYTICS_CONFIG.KV_EXPIRATION_TTL),
    updateJson(kv, 'notfound_total', () => ({}), bump),
  ]);
}

async function updateJson<T extends object>(
  kv: KVNamespace,
  key: string,
  empty: () => T,
  mutate: (data: T) => void,
  expirationTtl?: number,
): Promise<void> {
  let data = empty();
  try {
    const json = await kv.get(key);
    if (json) data = { ...data, ...JSON.parse(json) };
  } catch {
    // Corrupt value: start over
  }
  mutate(data);
  await kv.put(key, JSON.stringify(data), expirationTtl ? { expirationTtl } : undefined);
}

/** Read and merge audience + 404 data for a set of days, or the all-time totals */
export async function readAudience(
  kv: KVNamespace,
  dates: string[] | 'all',
): Promise<{ audience: AudienceData; notFound: Record<string, number> }> {
  const audienceKeys = dates === 'all' ? ['audience_total'] : dates.map((d) => `audience:${d}`);
  const notFoundKeys = dates === 'all' ? ['notfound_total'] : dates.map((d) => `notfound:${d}`);

  const [audienceJson, notFoundJson] = await Promise.all([
    Promise.all(audienceKeys.map((k) => kv.get(k))),
    Promise.all(notFoundKeys.map((k) => kv.get(k))),
  ]);

  const audience = emptyAudienceData();
  for (const json of audienceJson) {
    try {
      if (json) mergeAudienceData(audience, JSON.parse(json));
    } catch { /* skip corrupt day */ }
  }
  const notFound: Record<string, number> = {};
  for (const json of notFoundJson) {
    try {
      if (json) mergeCounts(notFound, JSON.parse(json));
    } catch { /* skip corrupt day */ }
  }
  return { audience, notFound };
}
