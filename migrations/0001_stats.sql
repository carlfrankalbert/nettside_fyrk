-- Analytics storage for /stats. Same privacy model as the KV data it replaces:
-- aggregate counts, plus per-day anonymous visitor hashes (daily salt, deleted
-- after two days, so hashes can't be linked across days or reversed).

-- Every count the dashboard shows, per UTC day and hour.
-- Totals, daily and hourly numbers are sums over this table.
--   metric     what is counted: pageview, click, article_view, country, ...
--   scope      what it belongs to: pageId for referrers, event id for tool metrics, '' otherwise
--   dimension  the counted value: pageId, buttonId, country code, referrer, ...
--   count      events, or an amount (characters, milliseconds) for event_chars / event_ms
CREATE TABLE counters (
  day TEXT NOT NULL,
  hour INTEGER NOT NULL,
  metric TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  dimension TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, metric, scope, dimension)
) WITHOUT ROWID;

CREATE INDEX counters_metric_day ON counters (metric, day);

-- Who was seen, once per day per scope: 'site', 'page:{id}', 'article:{slug}', 'event:{id}'.
-- An insert that conflicts is an existing visitor; unique counts are COUNT(*) per day.
-- Rows older than the retention period are deleted by the writer.
CREATE TABLE visitors (
  day TEXT NOT NULL,
  scope TEXT NOT NULL,
  hash TEXT NOT NULL,
  PRIMARY KEY (day, scope, hash)
) WITHOUT ROWID;
