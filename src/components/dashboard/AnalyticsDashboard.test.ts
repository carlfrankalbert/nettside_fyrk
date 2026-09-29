import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AnalyticsDashboard } from './AnalyticsDashboard';

const originalTz = process.env.TZ;

function renderIn(timeZone: string, period: 'today' | '7d'): string {
  process.env.TZ = timeZone;
  return renderToString(
    createElement(AnalyticsDashboard, {
      period,
      buttonCounts: {},
      pageStats: {},
      totalClicks: 0,
      toolMetrics: {},
      // 23:30 UTC: already the next day in Oslo
      dataTimestamp: Date.UTC(2026, 8, 28, 23, 30),
    }),
  );
}

describe('AnalyticsDashboard hydration', () => {
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  // Regression: the server (UTC) and an iPhone in Norway rendered different
  // timestamps, so React's hydration failed (#418) on every load.
  it.each(['today', '7d'] as const)('renders the same HTML in any time zone (%s)', (period) => {
    const server = renderIn('UTC', period);
    const browser = renderIn('America/New_York', period);
    expect(browser).toBe(server);
    expect(server).toContain('29. sep., 01:30');
  });
});
