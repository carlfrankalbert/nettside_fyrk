/**
 * Analytics writes to D1 (schema: migrations/0001_stats.sql).
 *
 * KV stored counters as read → modify → write, so two requests close together
 * (or a stale read at another edge location) could overwrite each other's
 * update. Here every change is a single atomic statement, and one event's
 * statements run as one batch (a single transaction and round trip).
 *
 * Values must already be sanitized by the caller; this module only stores them.
 */

import { getDateKey } from '../utils/analytics-helpers';
import { ANALYTICS_CONFIG } from '../utils/constants';

/** Daily visitor hashes are kept as long as KV kept its daily sets */
const RETENTION_DAYS = Math.floor(ANALYTICS_CONFIG.KV_EXPIRATION_TTL / (24 * 60 * 60));
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AudienceValues {
  country?: string;
  organization?: string;
  asn?: number;
  device?: string;
  browser?: string;
}

export interface AcquisitionValues {
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface PageviewEvent {
  timestamp: number;
  pageId: string;
  visitorHash: string;
  /** Published Innsikt slug, when the page is an article */
  articleSlug?: string | null;
  /** Requested path, when the page is the 404 page */
  notFoundPath?: string;
  acquisition: AcquisitionValues;
  audience: AudienceValues;
}

export interface ClickEvent {
  timestamp: number;
  buttonId: string;
  visitorHash: string;
  metadata: {
    charCount?: number;
    processingTimeMs?: number;
    cached?: boolean;
    errorType?: string;
  };
}

interface Counter {
  metric: string;
  scope?: string;
  dimension: string | undefined;
  amount?: number;
}

const UPSERT_COUNTER = `
  INSERT INTO counters (day, hour, metric, scope, dimension, count) VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT DO UPDATE SET count = count + excluded.count`;

/** Same upsert, skipped when the visitor was already seen on the site that day */
const UPSERT_COUNTER_IF_NEW_SITE_VISITOR = `
  INSERT INTO counters (day, hour, metric, scope, dimension, count)
  SELECT ?, ?, ?, ?, ?, ?
  WHERE NOT EXISTS (SELECT 1 FROM visitors WHERE day = ? AND scope = 'site' AND hash = ?)
  ON CONFLICT DO UPDATE SET count = count + excluded.count`;

/** Returns a row only when the visitor is new for that day and scope */
const INSERT_VISITOR = `
  INSERT INTO visitors (day, scope, hash) VALUES (?, ?, ?)
  ON CONFLICT DO NOTHING RETURNING 1 AS isNew`;

const DELETE_EXPIRED_VISITORS = 'DELETE FROM visitors WHERE day < ?';

function timeBucket(timestamp: number): { day: string; hour: number } {
  return { day: getDateKey(timestamp), hour: new Date(timestamp).getUTCHours() };
}

/** Drop counters with no value; an amount counter (chars, ms) needs a positive amount */
function present(counters: Counter[]): (Counter & { dimension: string })[] {
  return counters.filter((c): c is Counter & { dimension: string } =>
    !!c.dimension && (!('amount' in c) || (c.amount ?? 0) > 0));
}

/**
 * Record one page view: the view, unique visitors (page, site, article),
 * audience dimensions (once per site visitor per day), 404 path and acquisition.
 * Returns whether this is the visitor's first view of this page today.
 */
export async function recordPageview(db: D1Database, event: PageviewEvent): Promise<{ isNewVisitor: boolean }> {
  const { day, hour } = timeBucket(event.timestamp);
  const bind = (sql: string, c: Counter & { dimension: string }) =>
    db.prepare(sql).bind(day, hour, c.metric, c.scope ?? '', c.dimension, c.amount ?? 1);

  const { audience, acquisition } = event;
  const audienceCounters = present([
    { metric: 'country', dimension: audience.country },
    { metric: 'organization', dimension: audience.organization },
    // Network name → AS number, most frequent wins when read
    { metric: 'network_asn', scope: audience.organization, dimension: audience.asn ? String(audience.asn) : undefined },
    { metric: 'device', dimension: audience.device },
    { metric: 'browser', dimension: audience.browser },
  ]).filter((c) => c.metric !== 'network_asn' || c.scope);

  const counters = present([
    { metric: 'pageview', dimension: event.pageId },
    { metric: 'article_view', dimension: event.articleSlug ?? undefined },
    { metric: 'notfound', dimension: event.notFoundPath },
    { metric: 'referrer', scope: event.pageId, dimension: acquisition.referrer },
    { metric: 'utm_source', scope: event.pageId, dimension: acquisition.source },
    { metric: 'utm_medium', scope: event.pageId, dimension: acquisition.medium },
    { metric: 'utm_campaign', scope: event.pageId, dimension: acquisition.campaign },
  ]);

  const statements = [
    // Audience first: it checks the site visitor row that the next statements insert
    ...audienceCounters.map((c) => db.prepare(UPSERT_COUNTER_IF_NEW_SITE_VISITOR).bind(
      day, hour, c.metric, c.scope ?? '', c.dimension, 1, day, event.visitorHash,
    )),
    db.prepare(INSERT_VISITOR).bind(day, `page:${event.pageId}`, event.visitorHash),
    db.prepare(INSERT_VISITOR).bind(day, 'site', event.visitorHash),
    ...(event.articleSlug ? [db.prepare(INSERT_VISITOR).bind(day, `article:${event.articleSlug}`, event.visitorHash)] : []),
    ...counters.map((c) => bind(UPSERT_COUNTER, c)),
    db.prepare(DELETE_EXPIRED_VISITORS).bind(getDateKey(event.timestamp - RETENTION_DAYS * DAY_MS)),
  ];

  const results = await db.batch(statements);
  const pageVisitorResult = results[audienceCounters.length];
  return { isNewVisitor: (pageVisitorResult?.results?.length ?? 0) > 0 };
}

/**
 * Record one tracked click or tool event, with the per-event metrics the
 * dashboard shows for the AI tools (characters, time, cache hits, error types).
 */
export async function recordClick(db: D1Database, event: ClickEvent): Promise<void> {
  const { day, hour } = timeBucket(event.timestamp);
  const { buttonId, metadata } = event;

  const counters = present([
    { metric: 'click', dimension: buttonId },
    { metric: 'event_chars', scope: buttonId, dimension: 'total', amount: metadata.charCount },
    { metric: 'event_ms', scope: buttonId, dimension: 'total', amount: metadata.processingTimeMs },
    { metric: 'event_cache', scope: buttonId, dimension: metadata.cached === undefined ? undefined : metadata.cached ? 'cached' : 'fresh' },
    { metric: 'event_error', scope: buttonId, dimension: metadata.errorType },
  ]);

  await db.batch([
    ...counters.map((c) => db.prepare(UPSERT_COUNTER).bind(day, hour, c.metric, c.scope ?? '', c.dimension, c.amount ?? 1)),
    db.prepare(INSERT_VISITOR).bind(day, `event:${buttonId}`, event.visitorHash),
  ]);
}
