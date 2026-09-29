import { describe, it, expect } from 'vitest';
import { recordPageview, recordClick, type PageviewEvent } from './stats-db';
import { createTestD1 } from '../test/sqlite-d1';

const T = Date.UTC(2026, 8, 30, 14, 5);

function pageview(overrides: Partial<PageviewEvent> = {}): PageviewEvent {
  return {
    timestamp: T,
    pageId: 'home',
    visitorHash: 'aaaa',
    acquisition: {},
    audience: { country: 'NO', organization: 'Telenor Norge AS', asn: 2119, device: 'Mobil', browser: 'Safari' },
    ...overrides,
  };
}

function counters(sqlite: ReturnType<typeof createTestD1>['sqlite'], metric: string) {
  return Object.fromEntries(
    (sqlite.prepare('SELECT scope, dimension, SUM(count) AS n FROM counters WHERE metric = ? GROUP BY scope, dimension')
      .all(metric) as { scope: string; dimension: string; n: number }[])
      .map((r) => [r.scope ? `${r.scope}|${r.dimension}` : r.dimension, r.n]),
  );
}

function visitorCount(sqlite: ReturnType<typeof createTestD1>['sqlite'], scope: string) {
  return (sqlite.prepare('SELECT COUNT(*) AS n FROM visitors WHERE scope = ?').get(scope) as { n: number }).n;
}

describe('recordPageview', () => {
  it('counts views, unique visitors and audience once per site visitor per day', async () => {
    const { db, sqlite } = createTestD1();

    const first = await recordPageview(db, pageview());
    const again = await recordPageview(db, pageview());
    await recordPageview(db, pageview({ pageId: 'okr' }));
    await recordPageview(db, pageview({ visitorHash: 'bbbb', audience: { country: 'UY', device: 'Desktop', browser: 'Firefox' } }));

    expect(first.isNewVisitor).toBe(true);
    expect(again.isNewVisitor).toBe(false);
    expect(counters(sqlite, 'pageview')).toEqual({ home: 3, okr: 1 });
    expect(visitorCount(sqlite, 'page:home')).toBe(2);
    expect(visitorCount(sqlite, 'site')).toBe(2);
    // Four views, but only two people: audience counts each once
    expect(counters(sqlite, 'country')).toEqual({ NO: 1, UY: 1 });
    expect(counters(sqlite, 'organization')).toEqual({ 'Telenor Norge AS': 1 });
    expect(counters(sqlite, 'network_asn')).toEqual({ 'Telenor Norge AS|2119': 1 });
    expect(counters(sqlite, 'device')).toEqual({ Mobil: 1, Desktop: 1 });
  });

  it('stores the hour, article reads, 404 paths and acquisition per page', async () => {
    const { db, sqlite } = createTestD1();

    await recordPageview(db, pageview({
      pageId: 'innsikt',
      articleSlug: 'okr-feller',
      acquisition: { referrer: 'linkedin.com', source: 'newsletter' },
    }));
    await recordPageview(db, pageview({ pageId: 'notfound', notFoundPath: '/gammel' }));

    expect(sqlite.prepare("SELECT day, hour FROM counters WHERE metric = 'pageview' LIMIT 1").get())
      .toEqual({ day: '2026-09-30', hour: 14 });
    expect(counters(sqlite, 'article_view')).toEqual({ 'okr-feller': 1 });
    expect(visitorCount(sqlite, 'article:okr-feller')).toBe(1);
    expect(counters(sqlite, 'notfound')).toEqual({ '/gammel': 1 });
    expect(counters(sqlite, 'referrer')).toEqual({ 'innsikt|linkedin.com': 1 });
    expect(counters(sqlite, 'utm_source')).toEqual({ 'innsikt|newsletter': 1 });
    expect(counters(sqlite, 'utm_medium')).toEqual({});
  });

  // Regression: KV read-modify-write lost a visitor when two page views
  // landed close together (2026-09-29: in the page set, missing from Publikum).
  it('loses no updates under concurrent page views', async () => {
    const { db, sqlite } = createTestD1();

    await Promise.all(Array.from({ length: 50 }, (_, i) =>
      recordPageview(db, pageview({ visitorHash: `v${i}` }))));

    expect(counters(sqlite, 'pageview')).toEqual({ home: 50 });
    expect(visitorCount(sqlite, 'site')).toBe(50);
    expect(counters(sqlite, 'country')).toEqual({ NO: 50 });
  });

  it('deletes visitor hashes past the retention period', async () => {
    const { db, sqlite } = createTestD1();
    sqlite.prepare("INSERT INTO visitors VALUES ('2025-01-01', 'site', 'old'), ('2026-09-01', 'site', 'recent')").run();

    await recordPageview(db, pageview());

    const days = (sqlite.prepare("SELECT day FROM visitors WHERE scope = 'site' ORDER BY day").all() as { day: string }[]).map((r) => r.day);
    expect(days).toEqual(['2026-09-01', '2026-09-30']);
  });
});

describe('recordClick', () => {
  it('counts clicks and sums tool metrics per event', async () => {
    const { db, sqlite } = createTestD1();

    await recordClick(db, { timestamp: T, buttonId: 'okr_success', visitorHash: 'a', metadata: { charCount: 300, processingTimeMs: 1200, cached: false } });
    await recordClick(db, { timestamp: T, buttonId: 'okr_success', visitorHash: 'a', metadata: { charCount: 100, cached: true } });
    await recordClick(db, { timestamp: T, buttonId: 'okr_error', visitorHash: 'b', metadata: { errorType: 'timeout' } });

    expect(counters(sqlite, 'click')).toEqual({ okr_success: 2, okr_error: 1 });
    expect(counters(sqlite, 'event_chars')).toEqual({ 'okr_success|total': 400 });
    expect(counters(sqlite, 'event_ms')).toEqual({ 'okr_success|total': 1200 });
    expect(counters(sqlite, 'event_cache')).toEqual({ 'okr_success|fresh': 1, 'okr_success|cached': 1 });
    expect(counters(sqlite, 'event_error')).toEqual({ 'okr_error|timeout': 1 });
    expect(visitorCount(sqlite, 'event:okr_success')).toBe(1);
  });
});
