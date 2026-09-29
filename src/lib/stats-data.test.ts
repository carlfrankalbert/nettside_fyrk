import { describe, it, expect } from 'vitest';
import { loadStats, getDateRange, parsePeriod, type StatsSources } from './stats-data';
import { createMockKV } from '../test/mock-kv';

const NOW = Date.UTC(2026, 8, 29, 12, 0);

const sources: StatsSources = {
  buttons: {
    cta: { key: 'clicks:cta', label: 'CTA' },
    menu: { key: 'clicks:menu', label: 'Meny' },
  },
  pages: {
    home: { key: 'pageviews:home', label: 'Forside' },
    okr: { key: 'pageviews:okr', label: 'OKR' },
  },
  articles: [
    { slug: 'read', title: 'Lest' },
    { slug: 'unread', title: 'Ulest' },
  ],
};

describe('parsePeriod', () => {
  it('accepts known periods and defaults to today', () => {
    expect(parsePeriod('30d')).toBe('30d');
    expect(parsePeriod('all')).toBe('all');
    expect(parsePeriod(null)).toBe('today');
    expect(parsePeriod('1y')).toBe('today');
  });
});

describe('getDateRange', () => {
  it('returns UTC date keys, most recent first', () => {
    expect(getDateRange('today', NOW)).toEqual(['2026-09-29']);
    expect(getDateRange('7d', NOW)).toEqual([
      '2026-09-29', '2026-09-28', '2026-09-27', '2026-09-26', '2026-09-25', '2026-09-24', '2026-09-23',
    ]);
    expect(getDateRange('30d', NOW)).toHaveLength(30);
    expect(getDateRange('all', NOW)).toEqual([]);
  });
});

describe('loadStats', () => {
  it('sums daily counters and unions visitor sets across the period', async () => {
    const { kv } = createMockKV({
      'clicks_daily:cta:2026-09-29': '3',
      'clicks_daily:cta:2026-09-28': '2',
      'clicks_daily:cta:2026-09-20': '100', // outside 7d
      'pageviews_daily:home:2026-09-29': '10',
      'pageviews_daily:home:2026-09-28': '5',
      'visitors:home:2026-09-29': '["a","b"]',
      'visitors:home:2026-09-28': '["b","c"]',
      'article_views_daily:innsikt:read:2026-09-29': '4',
      'article_visitors:innsikt:read:2026-09-29': '["a"]',
      'metrics:okr_success:2026-09-29': JSON.stringify({ count: 2, cachedCount: 1, errorTypes: {}, hourlyDistribution: { '09': 2 } }),
      'metrics:okr_success:2026-09-28': JSON.stringify({ count: 1, uniqueSessions: ['s1', 's2'], hourlyDistribution: { '09': 1 } }),
      'audience:2026-09-29': JSON.stringify({ countries: { NO: 2 } }),
    });

    const stats = await loadStats(kv, '7d', sources, NOW);

    expect(stats.buttonCounts).toEqual({ cta: { label: 'CTA', count: 5 }, menu: { label: 'Meny', count: 0 } });
    expect(stats.totalClicks).toBe(5);
    expect(stats.pageStats.home).toEqual({ label: 'Forside', views: 15, visitors: 3 });
    expect(stats.articleStats).toEqual([{ slug: 'read', title: 'Lest', views: 4, visitors: 1 }]);
    expect(stats.toolMetrics.okr_success).toMatchObject({
      count: 3, cachedCount: 1, uniqueSessionCount: 2, hourlyDistribution: { '09': 3 },
    });
    expect(stats.toolMetrics.okr_error).toBeUndefined();
    expect(stats.audience.countries).toEqual({ NO: 2 });
  });

  it('reads the all-time counters for "all"', async () => {
    const { kv } = createMockKV({
      'clicks:cta': '42',
      'pageviews:home': '900',
      'visitors_total:home': '300',
      'article_views_total:innsikt:read': '7',
      'article_visitors_total:innsikt:read': '5',
    });

    const stats = await loadStats(kv, 'all', sources, NOW);

    expect(stats.buttonCounts.cta.count).toBe(42);
    expect(stats.pageStats.home).toEqual({ label: 'Forside', views: 900, visitors: 300 });
    expect(stats.articleStats).toEqual([{ slug: 'read', title: 'Lest', views: 7, visitors: 5 }]);
    expect(stats.toolMetrics).toEqual({});
  });

  it('treats corrupt values as empty instead of failing', async () => {
    const { kv } = createMockKV({
      'clicks_daily:cta:2026-09-29': 'garbage',
      'visitors:home:2026-09-29': '{not json',
      'metrics:okr_success:2026-09-29': 'null',
      'audience:2026-09-29': 'null',
    });

    const stats = await loadStats(kv, 'today', sources, NOW);

    expect(stats.buttonCounts.cta.count).toBe(0);
    expect(stats.pageStats.home.visitors).toBe(0);
    expect(stats.toolMetrics).toEqual({});
  });

  // Regression: "Besøkende" summed per-page visitors, so one person reading
  // four pages counted as four (production 2026-09-29: 6 shown, 3 real).
  it('counts site visitors once per day, however many pages they saw', async () => {
    const { kv } = createMockKV({
      'visitors:home:2026-09-29': '["a","b","c"]',
      'visitors:okr:2026-09-29': '["a"]',
      'visitors:home:2026-09-28': '["x"]', // new daily salt: a new hash for the same person
    });

    const stats = await loadStats(kv, '7d', sources, NOW);

    expect(stats.pageStats.home.visitors).toBe(4);
    expect(stats.pageStats.okr.visitors).toBe(1);
    expect(stats.siteVisitors).toBe(4);
  });

  it('counts site visitors for "all" from the retained daily sets', async () => {
    const { kv, stats: ops } = createMockKV({
      'visitors_total:home': '50', // per-page counters can't be de-duplicated
      'visitors:home:2026-09-29': '["a","b"]',
      'visitors:okr:2026-09-29': '["a"]',
      'visitors:okr:2026-04-01': '["z"]',
    });

    const stats = await loadStats(kv, 'all', sources, NOW);

    expect(stats.pageStats.home.visitors).toBe(50);
    expect(stats.siteVisitors).toBe(3);
    expect(ops.operations).toBeLessThan(20);
  });

  // Regression: one KV get per key made "30 dager" need ~3,200 operations,
  // over the Workers limit of 1,000 per request, so the page failed.
  it.each(['30d', 'all'] as const)('stays far below the 1,000 KV operation limit (%s, current size)', async (period) => {
    const many = (n: number, prefix: string) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`${prefix}${i}`, { key: `${prefix}${i}:total`, label: `${prefix}${i}` }]));
    const { kv, stats } = createMockKV();

    await loadStats(kv, period, {
      buttons: many(66, 'button'),
      pages: many(10, 'page'),
      articles: Array.from({ length: 6 }, (_, i) => ({ slug: `a${i}`, title: `A${i}` })),
    }, NOW);

    expect(stats.operations).toBeLessThan(60);
  });
});
