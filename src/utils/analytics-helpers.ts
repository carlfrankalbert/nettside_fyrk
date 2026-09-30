/**
 * Shared analytics utilities for API routes
 *
 * Shared by the tracking endpoints and the stats loaders: API headers,
 * UTC date keys, chart periods and month labels.
 */

/** Standard headers for API responses — prevents CDN caching of dynamic data */
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
} as const;

/** Norwegian month abbreviations */
export const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'] as const;

/** Get the date string for a timestamp (YYYY-MM-DD) */
export function getDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/** Time period definitions for chart queries */
export const TIME_PERIODS = {
  '24h': { hours: 24, granularity: 'hourly' as const },
  'week': { hours: 24 * 7, granularity: 'daily' as const },
  'month': { hours: 24 * 30, granularity: 'daily' as const },
  'year': { hours: 24 * 365, granularity: 'monthly' as const },
  'all': { hours: 24 * 365 * 2, granularity: 'monthly' as const },
} as const;

export type TimePeriod = keyof typeof TIME_PERIODS;

export interface TimeseriesEntry {
  label: string;
  value: number;
}
