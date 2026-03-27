/**
 * Shared analytics utilities for API routes
 *
 * Extracts common patterns from track.ts and pageview.ts:
 * date/time key generation, time periods, KV timeseries fetching,
 * visitor timeseries, and acquisition data aggregation.
 */

import {
  mergeAcquisitionData,
  emptyAcquisitionData,
  type AcquisitionData,
} from './acquisition';

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

/** Get the hour key for a timestamp (YYYY-MM-DD-HH) */
export function getHourKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toISOString().split('T')[0]}-${String(date.getUTCHours()).padStart(2, '0')}`;
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

/**
 * Fetch count-based timeseries data from KV.
 * Handles hourly, daily, and monthly granularity with parallel KV fetches.
 */
export async function fetchCountTimeseries(
  kv: KVNamespace,
  hourlyPrefix: string,
  dailyPrefix: string,
  entityId: string,
  period: TimePeriod,
): Promise<TimeseriesEntry[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();

  if (config.granularity === 'hourly') {
    const entries: { key: string; label: string }[] = [];
    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const hourKey = getHourKey(time);
      const date = new Date(time);
      entries.push({
        key: `${hourlyPrefix}:${entityId}:${hourKey}`,
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
      });
    }
    const counts = await Promise.all(entries.map(e => kv.get(e.key)));
    return entries.map((entry, i) => ({
      label: entry.label,
      value: parseInt(counts[i] || '0', 10) || 0,
    }));
  }

  if (config.granularity === 'daily') {
    const days = period === 'week' ? 7 : 30;
    const entries: { key: string; label: string }[] = [];
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const date = new Date(time);
      entries.push({
        key: `${dailyPrefix}:${entityId}:${dateKey}`,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      });
    }
    const counts = await Promise.all(entries.map(e => kv.get(e.key)));
    return entries.map((entry, i) => ({
      label: entry.label,
      value: parseInt(counts[i] || '0', 10) || 0,
    }));
  }

  // Monthly granularity — aggregate daily data
  const months = period === 'year' ? 12 : 24;
  const allDayKeys: { monthIndex: number; key: string }[] = [];
  const monthLabels: string[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now);
    monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthLabels.push(`${MONTH_NAMES[month]} ${year.toString().slice(2)}`);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allDayKeys.push({
        monthIndex: i,
        key: `${dailyPrefix}:${entityId}:${dateKey}`,
      });
    }
  }

  const dailyCounts = await Promise.all(allDayKeys.map(d => kv.get(d.key)));
  const monthTotals = new Array(months).fill(0);
  dailyCounts.forEach((count, i) => {
    monthTotals[allDayKeys[i].monthIndex] += parseInt(count || '0', 10) || 0;
  });

  return monthLabels.map((label, i) => ({
    label,
    value: monthTotals[i],
  }));
}

/**
 * Fetch unique visitors time-series data.
 * Handles hourly (today only), daily, and monthly granularity.
 */
export async function getVisitorsTimeseriesData(
  kv: KVNamespace,
  pageId: string,
  period: TimePeriod,
): Promise<TimeseriesEntry[]> {
  const config = TIME_PERIODS[period];
  const now = Date.now();
  const data: TimeseriesEntry[] = [];

  if (config.granularity === 'hourly') {
    const todayKey = `visitors:${pageId}:${getDateKey(now)}`;
    const todayVisitorsJson = await kv.get(todayKey);
    let count = 0;
    try {
      const visitors = todayVisitorsJson ? JSON.parse(todayVisitorsJson) : [];
      count = visitors.length;
    } catch {
      count = 0;
    }

    for (let i = 0; i < 24; i++) {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const date = new Date(time);
      data.push({
        label: `${String(date.getHours()).padStart(2, '0')}:00`,
        value: i === 23 ? count : 0,
      });
    }
  } else if (config.granularity === 'daily') {
    const days = period === 'week' ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const time = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
      const dateKey = getDateKey(time);
      const key = `visitors:${pageId}:${dateKey}`;
      const visitorsJson = await kv.get(key);
      let count = 0;
      try {
        const visitors = visitorsJson ? JSON.parse(visitorsJson) : [];
        count = visitors.length;
      } catch {
        count = 0;
      }
      const date = new Date(time);
      data.push({
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        value: count,
      });
    }
  } else if (config.granularity === 'monthly') {
    const months = period === 'year' ? 12 : 24;
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const uniqueVisitors = new Set<string>();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const key = `visitors:${pageId}:${dateKey}`;
        const visitorsJson = await kv.get(key);
        try {
          const visitors = visitorsJson ? JSON.parse(visitorsJson) : [];
          visitors.forEach((v: string) => uniqueVisitors.add(v));
        } catch {
          // Skip
        }
      }

      data.push({
        label: `${MONTH_NAMES[month]} ${year.toString().slice(2)}`,
        value: uniqueVisitors.size,
      });
    }
  }

  return data;
}

/**
 * Fetch acquisition data (referrer + UTM) aggregated across a time period.
 */
export async function getAcquisitionData(
  kv: KVNamespace,
  pageId: string,
  period: TimePeriod,
): Promise<AcquisitionData> {
  const now = Date.now();
  const result: AcquisitionData = emptyAcquisitionData();

  const days = period === '24h' ? 1
    : period === 'week' ? 7
    : period === 'month' ? 30
    : period === 'year' ? 365
    : 730;

  for (let i = 0; i < days; i++) {
    const time = now - i * 24 * 60 * 60 * 1000;
    const dateKey = getDateKey(time);
    const key = `acquisition:${pageId}:${dateKey}`;
    const data = await kv.get(key);

    if (data) {
      try {
        mergeAcquisitionData(result, JSON.parse(data));
      } catch {
        // Skip corrupt entries
      }
    }
  }

  return result;
}
