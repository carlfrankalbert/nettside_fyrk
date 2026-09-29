/**
 * Server-side data for the /stats dashboard, read from D1 (see stats-db.ts for
 * the writes and migrations/ for the schema).
 *
 * Every number is a SUM over `counters` or a COUNT over `visitors` for a day
 * range. Counts that predate the daily data sit on LEGACY_DAY, so they are part
 * of "all" and of no dated period.
 */

import { getDateKey, MONTH_NAMES, type TimePeriod, type TimeseriesEntry } from '../utils/analytics-helpers';
import { emptyAcquisitionData, type AcquisitionData } from '../utils/acquisition';
import { emptyAudienceData, type AudienceData } from '../utils/visitor-dimensions';

export const STATS_PERIODS = ['today', '7d', '30d', 'all'] as const;
export type StatsPeriod = typeof STATS_PERIODS[number];

export type ButtonCounts = Record<string, { count: number; label: string }>;
export type PageStats = Record<string, { label: string; views: number; visitors: number }>;
export interface ToolMetrics {
  count: number;
  totalCharCount: number;
  totalProcessingTimeMs: number;
  cachedCount: number;
  freshCount: number;
  errorTypes: Record<string, number>;
  uniqueSessionCount: number;
  hourlyDistribution: Record<string, number>;
}
export type AllMetrics = Record<string, ToolMetrics>;
export interface ArticleStat { slug: string; title: string; views: number; visitors: number }

export interface StatsData {
  buttonCounts: ButtonCounts;
  pageStats: PageStats;
  totalClicks: number;
  /** Unique visitors across the whole site: each person once per day, however many pages they saw */
  siteVisitors: number;
  toolMetrics: AllMetrics;
  articleStats: ArticleStat[];
  audience: AudienceData;
  notFoundPaths: Record<string, number>;
}

/** What to report on: tracked buttons and pages (id → label) and published articles */
export interface StatsSources {
  buttons: Record<string, { label: string }>;
  pages: Record<string, { label: string }>;
  articles: { slug: string; title: string }[];
}

const TOOL_EVENTS = [
  'okr_success', 'konseptspeil_success', 'antakelseskart_success', 'premortem_success',
  'okr_error', 'konseptspeil_error', 'antakelseskart_error', 'premortem_error',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Where the history import put all-time counts older than the daily data */
export const LEGACY_DAY = '1970-01-01';

/** A day range that covers everything, legacy day included */
const ALL_DAYS = { from: '0000-00-00', to: '9999-99-99' };

export function parsePeriod(value: string | null): StatsPeriod {
  return (STATS_PERIODS as readonly string[]).includes(value ?? '') ? value as StatsPeriod : 'today';
}

/** UTC date keys (YYYY-MM-DD) for a period, most recent first */
export function getDateRange(period: StatsPeriod, now = Date.now()): string[] {
  const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 0;
  return Array.from({ length: days }, (_, i) => getDateKey(now - i * DAY_MS));
}

function dayRange(period: StatsPeriod, now: number): { from: string; to: string } {
  if (period === 'all') return ALL_DAYS;
  const dates = getDateRange(period, now);
  return { from: dates[dates.length - 1], to: dates[0] };
}

interface CounterRow { metric: string; scope: string; dimension: string; n: number }

/** metric → scope → dimension → count */
type Counts = Map<string, Map<string, Map<string, number>>>;

function indexCounts(rows: CounterRow[]): Counts {
  const counts: Counts = new Map();
  for (const { metric, scope, dimension, n } of rows) {
    const byScope = counts.get(metric) ?? counts.set(metric, new Map()).get(metric)!;
    const byDim = byScope.get(scope) ?? byScope.set(scope, new Map()).get(scope)!;
    byDim.set(dimension, (byDim.get(dimension) ?? 0) + n);
  }
  return counts;
}

function dims(counts: Counts, metric: string, scope = ''): Map<string, number> {
  return counts.get(metric)?.get(scope) ?? new Map();
}

function get(counts: Counts, metric: string, dimension: string, scope = ''): number {
  return dims(counts, metric, scope).get(dimension) ?? 0;
}

const toRecord = (m: Map<string, number>) => Object.fromEntries(m);

export async function loadStats(
  db: D1Database,
  period: StatsPeriod,
  sources: StatsSources,
  now = Date.now(),
): Promise<StatsData> {
  const { from, to } = dayRange(period, now);
  const placeholders = TOOL_EVENTS.map(() => '?').join(', ');

  const [counterRows, visitorRows, hourRows] = await db.batch([
    db.prepare(`
      SELECT metric, scope, dimension, SUM(count) AS n FROM counters
      WHERE day BETWEEN ? AND ? GROUP BY metric, scope, dimension`).bind(from, to),
    db.prepare(`
      SELECT scope, COUNT(*) AS n FROM visitors
      WHERE day BETWEEN ? AND ? GROUP BY scope`).bind(from, to),
    db.prepare(`
      SELECT dimension, hour, SUM(count) AS n FROM counters
      WHERE metric = 'click' AND day BETWEEN ? AND ? AND dimension IN (${placeholders})
      GROUP BY dimension, hour`).bind(from, to, ...TOOL_EVENTS),
  ]);

  const counts = indexCounts((counterRows.results ?? []) as unknown as CounterRow[]);
  const visitorsByScope = new Map(
    ((visitorRows.results ?? []) as unknown as { scope: string; n: number }[]).map((r) => [r.scope, r.n]),
  );
  // Hash rows, plus visitor counts imported from KV without hashes
  const visitors = (scope: string) => (visitorsByScope.get(scope) ?? 0) + get(counts, 'legacy_visitors', 'total', scope);

  const buttonCounts: ButtonCounts = {};
  for (const [id, { label }] of Object.entries(sources.buttons)) {
    buttonCounts[id] = { label, count: get(counts, 'click', id) };
  }

  const pageStats: PageStats = {};
  for (const [id, { label }] of Object.entries(sources.pages)) {
    pageStats[id] = { label, views: get(counts, 'pageview', id), visitors: visitors(`page:${id}`) };
  }

  const articleStats = sources.articles
    .map(({ slug, title }) => ({
      slug, title, views: get(counts, 'article_view', slug), visitors: visitors(`article:${slug}`),
    }))
    .filter((a) => a.views > 0)
    .sort((a, b) => b.views - a.views);

  // Tool metrics per day only: the all-time view never had them
  const toolMetrics: AllMetrics = {};
  if (period !== 'all') {
    const hours = new Map<string, Record<string, number>>();
    for (const { dimension, hour, n } of (hourRows.results ?? []) as unknown as { dimension: string; hour: number; n: number }[]) {
      (hours.get(dimension) ?? hours.set(dimension, {}).get(dimension)!)[String(hour)] = n;
    }
    for (const event of TOOL_EVENTS) {
      const count = get(counts, 'click', event);
      if (count === 0) continue;
      toolMetrics[event] = {
        count,
        totalCharCount: get(counts, 'event_chars', 'total', event),
        totalProcessingTimeMs: get(counts, 'event_ms', 'total', event),
        cachedCount: get(counts, 'event_cache', 'cached', event),
        freshCount: get(counts, 'event_cache', 'fresh', event),
        errorTypes: toRecord(dims(counts, 'event_error', event)),
        uniqueSessionCount: visitors(`event:${event}`),
        hourlyDistribution: hours.get(event) ?? {},
      };
    }
  }

  const audience = emptyAudienceData();
  audience.countries = toRecord(dims(counts, 'country'));
  audience.organizations = toRecord(dims(counts, 'organization'));
  audience.devices = toRecord(dims(counts, 'device'));
  audience.browsers = toRecord(dims(counts, 'browser'));
  // Network name → the AS number seen most often for it
  for (const [organization, asns] of counts.get('network_asn') ?? []) {
    const [asn] = [...asns].sort(([, a], [, b]) => b - a)[0] ?? [];
    if (asn) audience.networkAsns[organization] = Number(asn);
  }

  return {
    buttonCounts,
    pageStats,
    totalClicks: Object.values(buttonCounts).reduce((sum, b) => sum + b.count, 0),
    siteVisitors: visitorsByScope.get('site') ?? 0,
    toolMetrics,
    articleStats,
    audience,
    notFoundPaths: toRecord(dims(counts, 'notfound')),
  };
}

/**
 * Page views over time for the traffic charts: the last 24 hours by hour,
 * a week or a month by day, a year or everything by month.
 */
export async function loadPageviewTimeseries(
  db: D1Database,
  pageId: string,
  period: TimePeriod,
  now = Date.now(),
): Promise<TimeseriesEntry[]> {
  if (period === '24h') {
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const time = now - (23 - i) * 60 * 60 * 1000;
      const date = new Date(time);
      return { day: getDateKey(time), hour: date.getUTCHours(), label: `${String(date.getUTCHours()).padStart(2, '0')}:00` };
    });
    const { results } = await db.prepare(`
      SELECT day, hour, SUM(count) AS n FROM counters
      WHERE metric = 'pageview' AND dimension = ? AND day BETWEEN ? AND ? GROUP BY day, hour`)
      .bind(pageId, buckets[0].day, buckets[23].day).all<{ day: string; hour: number; n: number }>();
    const byHour = new Map(results.map((r) => [`${r.day}|${r.hour}`, r.n]));
    return buckets.map(({ day, hour, label }) => ({ label, value: byHour.get(`${day}|${hour}`) ?? 0 }));
  }

  if (period === 'week' || period === 'month') {
    const dayCount = period === 'week' ? 7 : 30;
    const days = Array.from({ length: dayCount }, (_, i) => {
      const time = now - (dayCount - 1 - i) * DAY_MS;
      const date = new Date(time);
      return { day: getDateKey(time), label: `${date.getUTCDate()}/${date.getUTCMonth() + 1}` };
    });
    const { results } = await db.prepare(`
      SELECT day, SUM(count) AS n FROM counters
      WHERE metric = 'pageview' AND dimension = ? AND day BETWEEN ? AND ? GROUP BY day`)
      .bind(pageId, days[0].day, days[days.length - 1].day).all<{ day: string; n: number }>();
    const byDay = new Map(results.map((r) => [r.day, r.n]));
    return days.map(({ day, label }) => ({ label, value: byDay.get(day) ?? 0 }));
  }

  const monthCount = period === 'year' ? 12 : 24;
  const current = new Date(now);
  const months = Array.from({ length: monthCount }, (_, i) => {
    const date = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - (monthCount - 1 - i), 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    return { key: `${year}-${String(month + 1).padStart(2, '0')}`, label: `${MONTH_NAMES[month]} ${String(year).slice(2)}` };
  });
  const { results } = await db.prepare(`
    SELECT substr(day, 1, 7) AS month, SUM(count) AS n FROM counters
    WHERE metric = 'pageview' AND dimension = ? AND day BETWEEN ? AND ? GROUP BY month`)
    .bind(pageId, `${months[0].key}-01`, `${months[monthCount - 1].key}-31`).all<{ month: string; n: number }>();
  const byMonth = new Map(results.map((r) => [r.month, r.n]));
  return months.map(({ key, label }) => ({ label, value: byMonth.get(key) ?? 0 }));
}

const ACQUISITION_DAYS: Record<TimePeriod, number | null> = { '24h': 1, week: 7, month: 30, year: 365, all: null };

/** Referrers and UTM values for a page over a period */
export async function loadAcquisition(
  db: D1Database,
  pageId: string,
  period: TimePeriod,
  now = Date.now(),
): Promise<AcquisitionData> {
  const days = ACQUISITION_DAYS[period];
  const { from, to } = days === null ? ALL_DAYS : { from: getDateKey(now - (days - 1) * DAY_MS), to: getDateKey(now) };

  const { results } = await db.prepare(`
    SELECT metric, dimension, SUM(count) AS n FROM counters
    WHERE metric IN ('referrer', 'utm_source', 'utm_medium', 'utm_campaign')
      AND scope = ? AND day BETWEEN ? AND ? GROUP BY metric, dimension`)
    .bind(pageId, from, to).all<{ metric: string; dimension: string; n: number }>();

  const data = emptyAcquisitionData();
  const field = { referrer: data.referrers, utm_source: data.sources, utm_medium: data.mediums, utm_campaign: data.campaigns };
  for (const { metric, dimension, n } of results) {
    field[metric as keyof typeof field][dimension] = n;
  }
  return data;
}
