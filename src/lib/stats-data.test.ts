import { describe, it, expect } from 'vitest';
import {
  loadStats, loadPageviewTimeseries, loadAcquisition, getDateRange, parsePeriod, LEGACY_DAY,
  type StatsSources,
} from './stats-data';
import { recordPageview, recordClick, type PageviewEvent } from './stats-db';
import { createTestD1 } from '../test/sqlite-d1';

const NOW = Date.UTC(2026, 8, 30, 12, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const sources: StatsSources = {
  buttons: { cta: { label: 'CTA' }, okr_success: { label: 'OKR ferdig' } },
  pages: { home: { label: 'Forside' }, okr: { label: 'OKR' } },
  articles: [{ slug: 'read', title: 'Lest' }, { slug: 'unread', title: 'Ulest' }],
};

function view(overrides: Partial<PageviewEvent> = {}): PageviewEvent {
  return {
    timestamp: NOW, pageId: 'home', visitorHash: 'a', acquisition: {},
    audience: { country: 'NO', organization: 'Telenor Norge AS', asn: 2119, device: 'Mobil', browser: 'Safari' },
    ...overrides,
  };
}

function insertCounter(sqlite: ReturnType<typeof createTestD1>['sqlite'], day: string, metric: string, dimension: string, count: number, scope = '') {
  sqlite.prepare('INSERT INTO counters VALUES (?, 0, ?, ?, ?, ?)').run(day, metric, scope, dimension, count);
}

describe('parsePeriod', () => {
  it('accepts known periods and defaults to today', () => {
    expect(parsePeriod('30d')).toBe('30d');
    expect(parsePeriod(null)).toBe('today');
    expect(parsePeriod('1y')).toBe('today');
  });
});

describe('getDateRange', () => {
  it('returns UTC date keys, most recent first', () => {
    expect(getDateRange('today', NOW)).toEqual(['2026-09-30']);
    expect(getDateRange('7d', NOW)).toHaveLength(7);
    expect(getDateRange('7d', NOW)[6]).toBe('2026-09-24');
    expect(getDateRange('all', NOW)).toEqual([]);
  });
});

describe('loadStats', () => {
  it('sums the period and counts each visitor once per day across pages', async () => {
    const { db } = createTestD1();
    await recordPageview(db, view());
    await recordPageview(db, view({ pageId: 'okr' }));
    await recordPageview(db, view({ visitorHash: 'b', audience: { country: 'UY', device: 'Desktop', browser: 'Firefox' } }));
    await recordPageview(db, view({ timestamp: NOW - DAY, visitorHash: 'x' })); // yesterday, new daily hash
    await recordPageview(db, view({ timestamp: NOW - 10 * DAY, visitorHash: 'old' })); // outside 7d
    await recordPageview(db, view({ pageId: 'innsikt', articleSlug: 'read', visitorHash: 'b' }));
    await recordPageview(db, view({ pageId: 'notfound', notFoundPath: '/gammel', visitorHash: 'b' }));
    await recordClick(db, { timestamp: NOW, buttonId: 'cta', visitorHash: 'a', metadata: {} });

    const stats = await loadStats(db, '7d', sources, NOW);

    expect(stats.pageStats.home).toEqual({ label: 'Forside', views: 3, visitors: 3 });
    expect(stats.pageStats.okr).toEqual({ label: 'OKR', views: 1, visitors: 1 });
    expect(stats.siteVisitors).toBe(3); // a, b today; x yesterday
    expect(stats.buttonCounts).toEqual({ cta: { label: 'CTA', count: 1 }, okr_success: { label: 'OKR ferdig', count: 0 } });
    expect(stats.totalClicks).toBe(1);
    expect(stats.articleStats).toEqual([{ slug: 'read', title: 'Lest', views: 1, visitors: 1 }]);
    expect(stats.notFoundPaths).toEqual({ '/gammel': 1 });
    expect(stats.audience.countries).toEqual({ NO: 2, UY: 1 });
    expect(stats.audience.networkAsns).toEqual({ 'Telenor Norge AS': 2119 });
  });

  it('builds tool metrics from event counters, hours and sessions', async () => {
    const { db, sqlite } = createTestD1();
    await recordClick(db, { timestamp: NOW, buttonId: 'okr_success', visitorHash: 'a', metadata: { charCount: 300, processingTimeMs: 1000, cached: false } });
    await recordClick(db, { timestamp: NOW - 3 * HOUR, buttonId: 'okr_success', visitorHash: 'a', metadata: { charCount: 100, cached: true } });
    await recordClick(db, { timestamp: NOW, buttonId: 'okr_error', visitorHash: 'b', metadata: { errorType: 'timeout' } });
    // Sessions imported from KV as a count
    insertCounter(sqlite, '2026-09-29', 'legacy_visitors', 'total', 4, 'event:okr_success');

    const { toolMetrics } = await loadStats(db, '7d', sources, NOW);

    expect(toolMetrics.okr_success).toEqual({
      count: 2, totalCharCount: 400, totalProcessingTimeMs: 1000, cachedCount: 1, freshCount: 1,
      errorTypes: {}, uniqueSessionCount: 5, hourlyDistribution: { '9': 1, '12': 1 },
    });
    expect(toolMetrics.okr_error.errorTypes).toEqual({ timeout: 1 });
    expect(toolMetrics.premortem_success).toBeUndefined();
  });

  it('includes legacy all-time counts in "all" and in no dated period', async () => {
    const { db, sqlite } = createTestD1();
    await recordPageview(db, view());
    insertCounter(sqlite, LEGACY_DAY, 'pageview', 'home', 900);
    insertCounter(sqlite, LEGACY_DAY, 'legacy_visitors', 'total', 300, 'page:home');
    await recordClick(db, { timestamp: NOW, buttonId: 'okr_success', visitorHash: 'a', metadata: {} });

    const all = await loadStats(db, 'all', sources, NOW);
    const today = await loadStats(db, 'today', sources, NOW);

    expect(all.pageStats.home).toEqual({ label: 'Forside', views: 901, visitors: 301 });
    expect(all.siteVisitors).toBe(1);
    expect(all.toolMetrics).toEqual({});
    expect(today.pageStats.home).toEqual({ label: 'Forside', views: 1, visitors: 1 });
  });

  it('returns empty data for an empty database', async () => {
    const { db } = createTestD1();
    const stats = await loadStats(db, '30d', sources, NOW);
    expect(stats.totalClicks).toBe(0);
    expect(stats.siteVisitors).toBe(0);
    expect(stats.articleStats).toEqual([]);
    expect(stats.audience.countries).toEqual({});
  });
});

describe('loadPageviewTimeseries', () => {
  it('buckets the last 24 hours by UTC hour, across midnight', async () => {
    const { db } = createTestD1();
    await recordPageview(db, view());                                  // 12:00 today
    await recordPageview(db, view({ timestamp: NOW - 13 * HOUR }));     // 23:00 yesterday
    await recordPageview(db, view({ timestamp: NOW - 25 * HOUR }));     // outside

    const series = await loadPageviewTimeseries(db, 'home', '24h', NOW);

    expect(series).toHaveLength(24);
    expect(series[23]).toEqual({ label: '12:00', value: 1 });
    expect(series[10]).toEqual({ label: '23:00', value: 1 });
    expect(series.reduce((s, p) => s + p.value, 0)).toBe(2);
  });

  it('returns days for a week and months for "all", without the legacy day', async () => {
    const { db, sqlite } = createTestD1();
    await recordPageview(db, view());
    await recordPageview(db, view({ timestamp: NOW - 6 * DAY }));
    insertCounter(sqlite, LEGACY_DAY, 'pageview', 'home', 900);
    insertCounter(sqlite, '2026-08-15', 'pageview', 'home', 5);

    const week = await loadPageviewTimeseries(db, 'home', 'week', NOW);
    const all = await loadPageviewTimeseries(db, 'home', 'all', NOW);

    expect(week.map((p) => p.value)).toEqual([1, 0, 0, 0, 0, 0, 1]);
    expect(week[6].label).toBe('30/9');
    expect(all).toHaveLength(24);
    expect(all[23]).toEqual({ label: 'sep 26', value: 2 });
    expect(all[22]).toEqual({ label: 'aug 26', value: 5 });
  });
});

describe('loadAcquisition', () => {
  it('sums referrers and UTM values for a page over the period', async () => {
    const { db } = createTestD1();
    await recordPageview(db, view({ acquisition: { referrer: 'linkedin.com', source: 'newsletter' } }));
    await recordPageview(db, view({ timestamp: NOW - 2 * DAY, acquisition: { referrer: 'linkedin.com' } }));
    await recordPageview(db, view({ pageId: 'okr', acquisition: { referrer: 'google.com' } }));

    expect(await loadAcquisition(db, 'home', '24h', NOW)).toEqual({
      referrers: { 'linkedin.com': 1 }, sources: { newsletter: 1 }, mediums: {}, campaigns: {},
    });
    expect((await loadAcquisition(db, 'home', 'week', NOW)).referrers).toEqual({ 'linkedin.com': 2 });
  });
});
