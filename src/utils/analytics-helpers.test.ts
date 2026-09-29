import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchCountTimeseries, getDateKey } from './analytics-helpers';
import { createMockKV } from '../test/mock-kv';

const NOW = Date.UTC(2026, 8, 29, 12, 0);
const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchCountTimeseries', () => {
  it('returns one point per day for a week, oldest first', async () => {
    vi.useFakeTimers({ now: NOW });
    const { kv } = createMockKV({
      [`pageviews_daily:home:${getDateKey(NOW)}`]: '5',
      [`pageviews_daily:home:${getDateKey(NOW - 6 * DAY)}`]: '2',
    });

    const series = await fetchCountTimeseries(kv, 'pageviews', 'pageviews_daily', 'home', 'week');

    expect(series).toHaveLength(7);
    expect(series[0].value).toBe(2);
    expect(series[6].value).toBe(5);
  });

  it('sums days into months for "all" in a handful of bulk reads', async () => {
    vi.useFakeTimers({ now: NOW });
    const { kv, stats } = createMockKV({
      'pageviews_daily:home:2026-09-01': '3',
      'pageviews_daily:home:2026-09-29': '4',
      'pageviews_daily:home:2026-08-15': 'garbage',
    });

    const series = await fetchCountTimeseries(kv, 'pageviews', 'pageviews_daily', 'home', 'all');

    expect(series).toHaveLength(24);
    expect(series[23]).toEqual({ label: 'sep 26', value: 7 });
    expect(series[22].value).toBe(0);
    // ~730 day keys: was one operation each, over the 1,000 limit with the visitor series
    expect(stats.operations).toBeLessThanOrEqual(8);
  });
});
