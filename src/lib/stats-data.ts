/**
 * Server-side data for the /stats dashboard.
 *
 * All keys a period needs are collected first and read with bulk gets
 * (see kv-batch.ts), so a 30-day view costs ~35 KV operations instead of ~3,200
 * ("all" reads every retained day of visitor sets: ~45).
 */

import { getMany, parseCount, parseHashes, parseJson } from './kv-batch';
import { getDateKey } from '../utils/analytics-helpers';
import { ANALYTICS_CONFIG } from '../utils/constants';
import { readAudience, type AudienceData } from '../utils/visitor-dimensions';

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

/** What to report on: tracked buttons and pages (id → KV key of the all-time total) and published articles */
export interface StatsSources {
  buttons: Record<string, { key: string; label: string }>;
  pages: Record<string, { key: string; label: string }>;
  articles: { slug: string; title: string }[];
}

const TOOL_EVENTS = [
  'okr_success', 'konseptspeil_success', 'antakelseskart_success', 'premortem_success',
  'okr_error', 'konseptspeil_error', 'antakelseskart_error', 'premortem_error',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Daily visitor sets expire with the rest of the daily data */
const RETAINED_DAYS = Math.floor(ANALYTICS_CONFIG.KV_EXPIRATION_TTL / (24 * 60 * 60));

export function parsePeriod(value: string | null): StatsPeriod {
  return (STATS_PERIODS as readonly string[]).includes(value ?? '') ? value as StatsPeriod : 'today';
}

/** UTC date keys (YYYY-MM-DD) for a period, most recent first — the same keys the trackers write */
export function getDateRange(period: StatsPeriod, now = Date.now()): string[] {
  const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 0;
  return Array.from({ length: days }, (_, i) => getDateKey(now - i * DAY_MS));
}

function emptyToolMetrics(): ToolMetrics {
  return {
    count: 0, totalCharCount: 0, totalProcessingTimeMs: 0, cachedCount: 0, freshCount: 0,
    errorTypes: {}, uniqueSessionCount: 0, hourlyDistribution: {},
  };
}

interface StoredDailyMetrics extends Partial<Omit<ToolMetrics, 'errorTypes' | 'hourlyDistribution'>> {
  errorTypes?: Record<string, number>;
  hourlyDistribution?: Record<string, number>;
  uniqueSessions?: unknown[];
}

function addDailyMetrics(target: ToolMetrics, day: StoredDailyMetrics): void {
  target.count += day.count || 0;
  target.totalCharCount += day.totalCharCount || 0;
  target.totalProcessingTimeMs += day.totalProcessingTimeMs || 0;
  target.cachedCount += day.cachedCount || 0;
  target.freshCount += day.freshCount || 0;
  for (const [type, count] of Object.entries(day.errorTypes || {})) {
    target.errorTypes[type] = (target.errorTypes[type] || 0) + (Number(count) || 0);
  }
  for (const [hour, count] of Object.entries(day.hourlyDistribution || {})) {
    target.hourlyDistribution[hour] = (target.hourlyDistribution[hour] || 0) + (Number(count) || 0);
  }
  target.uniqueSessionCount += day.uniqueSessionCount || day.uniqueSessions?.length || 0;
}

/** Sum a counter across days */
function sumCounts(values: Map<string, string | null>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + parseCount(values.get(key)), 0);
}

/** Unique visitors across days (union of the daily hash sets) */
function countUnique(values: Map<string, string | null>, keys: string[]): number {
  const hashes = new Set<string>();
  for (const key of keys) parseHashes(values.get(key)).forEach((h) => hashes.add(h));
  return hashes.size;
}

export async function loadStats(
  kv: KVNamespace,
  period: StatsPeriod,
  sources: StatsSources,
  now = Date.now(),
): Promise<StatsData> {
  const all = period === 'all';
  const dates = getDateRange(period, now);
  const perDay = (prefix: string) => dates.map((d) => `${prefix}:${d}`);

  const buttons = Object.entries(sources.buttons).map(([id, { key, label }]) => ({
    id, label, keys: all ? [key] : perDay(`clicks_daily:${id}`),
  }));
  const pages = Object.entries(sources.pages).map(([id, { key, label }]) => ({
    id, label,
    viewKeys: all ? [key] : perDay(`pageviews_daily:${id}`),
    visitorKeys: all ? [`visitors_total:${id}`] : perDay(`visitors:${id}`),
  }));
  const articles = sources.articles.map(({ slug, title }) => ({
    slug, title,
    viewKeys: all ? [`article_views_total:innsikt:${slug}`] : perDay(`article_views_daily:innsikt:${slug}`),
    visitorKeys: all ? [`article_visitors_total:innsikt:${slug}`] : perDay(`article_visitors:innsikt:${slug}`),
  }));
  // Tool metrics are daily only; there is no meaningful all-time aggregate
  const metrics = TOOL_EVENTS.map((event) => ({ event, keys: perDay(`metrics:${event}`) }));

  const keys = [
    ...buttons.flatMap((b) => b.keys),
    ...pages.flatMap((p) => [...p.viewKeys, ...p.visitorKeys]),
    ...articles.flatMap((a) => [...a.viewKeys, ...a.visitorKeys]),
    ...metrics.flatMap((m) => m.keys),
  ];
  // Site-wide visitors: the union of every page's daily sets. The visitor hash
  // is the same on every page within a day, so a person counts once per day.
  // "All" has only per-page counters, so it reads every retained day instead.
  const siteDates = all
    ? Array.from({ length: RETAINED_DAYS }, (_, i) => getDateKey(now - i * DAY_MS))
    : dates;
  const siteVisitorKeys = Object.keys(sources.pages).flatMap((id) => siteDates.map((d) => `visitors:${id}:${d}`));

  const [values, { audience, notFound }] = await Promise.all([
    getMany(kv, [...keys, ...(all ? siteVisitorKeys : [])]),
    readAudience(kv, all ? 'all' : dates),
  ]);

  // All-time visitor totals are plain counters; daily visitors are hash sets
  const visitors = (visitorKeys: string[]) => (all ? sumCounts(values, visitorKeys) : countUnique(values, visitorKeys));

  const buttonCounts: ButtonCounts = {};
  for (const { id, label, keys: buttonKeys } of buttons) {
    buttonCounts[id] = { label, count: sumCounts(values, buttonKeys) };
  }

  const pageStats: PageStats = {};
  for (const { id, label, viewKeys, visitorKeys } of pages) {
    pageStats[id] = { label, views: sumCounts(values, viewKeys), visitors: visitors(visitorKeys) };
  }

  const toolMetrics: AllMetrics = {};
  for (const { event, keys: eventKeys } of metrics) {
    for (const key of eventKeys) {
      const day = parseJson<StoredDailyMetrics | null>(values.get(key), null);
      if (!day || typeof day !== 'object') continue;
      addDailyMetrics((toolMetrics[event] ??= emptyToolMetrics()), day);
    }
  }

  const articleStats = articles
    .map(({ slug, title, viewKeys, visitorKeys }) => ({
      slug, title, views: sumCounts(values, viewKeys), visitors: visitors(visitorKeys),
    }))
    .filter((a) => a.views > 0)
    .sort((a, b) => b.views - a.views);

  return {
    buttonCounts,
    pageStats,
    totalClicks: Object.values(buttonCounts).reduce((sum, b) => sum + b.count, 0),
    siteVisitors: countUnique(values, siteVisitorKeys),
    toolMetrics,
    articleStats,
    audience,
    notFoundPaths: notFound,
  };
}
