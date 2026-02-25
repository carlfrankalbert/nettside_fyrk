/**
 * Acquisition data utilities for referrer and UTM tracking
 * Pure functions extracted from pageview API for testability
 */

/**
 * Maximum unique referrer/UTM values per day per page
 * Prevents unbounded object growth from spoofed values
 */
export const MAX_ACQUISITION_ENTRIES = 500;

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
 * Increment a count in an acquisition field, respecting the entry cap
 */
export function incrementField(
  field: Record<string, number>,
  key: string | undefined,
  maxEntries: number = MAX_ACQUISITION_ENTRIES,
): void {
  if (!key) return;
  if (key in field) {
    field[key]++;
  } else if (Object.keys(field).length < maxEntries) {
    field[key] = 1;
  }
}

/**
 * Merge acquisition counts from one day into an accumulator
 */
export function mergeAcquisitionData(target: AcquisitionData, source: AcquisitionData): void {
  for (const [key, count] of Object.entries(source.referrers)) {
    target.referrers[key] = (target.referrers[key] || 0) + count;
  }
  for (const [key, count] of Object.entries(source.sources)) {
    target.sources[key] = (target.sources[key] || 0) + count;
  }
  for (const [key, count] of Object.entries(source.mediums)) {
    target.mediums[key] = (target.mediums[key] || 0) + count;
  }
  for (const [key, count] of Object.entries(source.campaigns)) {
    target.campaigns[key] = (target.campaigns[key] || 0) + count;
  }
}

/**
 * Create an empty AcquisitionData object
 */
export function emptyAcquisitionData(): AcquisitionData {
  return { referrers: {}, sources: {}, mediums: {}, campaigns: {} };
}
