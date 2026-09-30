/**
 * Acquisition data utilities for referrer and UTM tracking
 * Pure functions extracted from pageview API for testability
 */

/**
 * Aggregated acquisition data stored per page per day
 */
export interface AcquisitionData {
  referrers: Record<string, number>;
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

/**
 * Sanitize a referrer hostname: only allow valid domain characters
 */
export function sanitizeReferrer(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 253);
  // Must contain at least one dot (valid domain)
  return cleaned.includes('.') ? cleaned : undefined;
}

/**
 * Sanitize a UTM parameter value: allow common campaign tag characters
 */
export function sanitizeUtmValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_.+\s-]/g, '').trim().slice(0, 200);
  return cleaned || undefined;
}

/**
 * Create an empty AcquisitionData object
 */
export function emptyAcquisitionData(): AcquisitionData {
  return { referrers: {}, sources: {}, mediums: {}, campaigns: {} };
}
