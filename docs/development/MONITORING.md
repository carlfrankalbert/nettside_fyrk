# Monitoring Guide

This document describes the monitoring infrastructure for the Fyrk website, including error tracking, performance monitoring, and load testing.

## Overview

The monitoring stack consists of three main components:

1. **Error Monitoring (Sentry)** - Captures and tracks JavaScript errors
2. **Performance Monitoring (Web Vitals + Lighthouse CI)** - Measures Core Web Vitals and page performance
3. **Load Testing (k6)** - Validates API performance under load

## Error Monitoring with Sentry

### Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for JavaScript
3. Copy your DSN from Project Settings > Client Keys

### Configuration

Add the following environment variables to Cloudflare Pages:

```bash
PUBLIC_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
PUBLIC_SENTRY_ENVIRONMENT=production
PUBLIC_SENTRY_RELEASE=1.0.0  # Optional: for release tracking
```

For local development, create a `.env` file:

```bash
PUBLIC_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
PUBLIC_SENTRY_ENVIRONMENT=development
```

### What's Captured

The error tracking automatically captures:

- **Unhandled JavaScript errors** - Any uncaught exceptions
- **Promise rejections** - Unhandled async errors
- **Console errors** - Logged as breadcrumbs
- **User interactions** - Clicks, navigation (breadcrumbs)
- **HTTP requests** - API calls with status (breadcrumbs)
- **Context** - Browser, OS, device info

### Manual Error Reporting

For custom error tracking:

```typescript
import { captureException, captureMessage, addBreadcrumb } from '../lib/sentry';

// Report an exception
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { component: 'OKRReviewer' },
    extra: { input: userInput },
  });
}

// Report a message
captureMessage('User completed OKR evaluation', {
  level: 'info',
  tags: { feature: 'okr-sjekken' },
});

// Add breadcrumb for debugging
addBreadcrumb({
  category: 'user-action',
  message: 'Started OKR evaluation',
  level: 'info',
});
```

### Server-Side Error Tracking

For API routes, use the Sentry library:

```typescript
import { captureException } from '../../lib/sentry';

export const POST: APIRoute = async ({ request }) => {
  try {
    // ... your code
  } catch (error) {
    await captureException(error, {
      tags: { endpoint: 'okr-sjekken' },
      extra: { requestId: generateRequestId() },
    });
    throw error;
  }
};
```

## Performance Monitoring

### Real User Monitoring (RUM)

Web Vitals are automatically collected from real users and sent to `/api/vitals`.

#### Metrics Collected

| Metric | Description | Good | Needs Improvement | Poor |
|--------|-------------|------|-------------------|------|
| **LCP** | Largest Contentful Paint | ≤ 2.5s | ≤ 4s | > 4s |
| **FID** | First Input Delay | ≤ 100ms | ≤ 300ms | > 300ms |
| **CLS** | Cumulative Layout Shift | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| **FCP** | First Contentful Paint | ≤ 1.8s | ≤ 3s | > 3s |
| **TTFB** | Time to First Byte | ≤ 800ms | ≤ 1.8s | > 1.8s |
| **INP** | Interaction to Next Paint | ≤ 200ms | ≤ 500ms | > 500ms |

#### Viewing Vitals Data

```bash
# Get aggregated vitals (requires STATS_TOKEN)
curl -H "Authorization: Bearer YOUR_STATS_TOKEN" https://fyrk.no/api/vitals
```

Response:
```json
{
  "vitals": {
    "LCP": {
      "name": "LCP",
      "count": 1234,
      "avg": 1850,
      "p75": 2100,
      "goodPercent": 78,
      "needsImprovementPercent": 18,
      "poorPercent": 4
    }
  }
}
```

### Lighthouse CI

Automated performance testing runs on every PR and weekly.

#### Running Locally

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run against production
lhci autorun --collect.url=https://fyrk.no --collect.url=https://fyrk.no/okr-sjekken

# Run against local server
npm run build && npm run preview &
lhci autorun --collect.url=http://localhost:4321
```

#### Performance Budgets

See `lighthouse-budget.json` for current thresholds:

| Metric | Budget |
|--------|--------|
| Time to Interactive | 3.5s |
| First Contentful Paint | 1.8s |
| Largest Contentful Paint | 2.5s |
| Cumulative Layout Shift | 0.1 |
| Total Blocking Time | 300ms |
| Total JS Size | 200KB |
| Total Page Size | 500KB |

#### CI Integration

The Lighthouse CI workflow (`.github/workflows/lighthouse-ci.yml`):

- Runs on every PR to `main`
- Runs weekly on Mondays
- Posts results as PR comments
- Fails if performance score < 80

## Load Testing

### Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

### Running Load Tests

```bash
# Smoke test (quick validation)
npm run test:load

# Sustained load (10 concurrent users)
npm run test:load:sustained

# Stress test (find breaking point)
npm run test:load:stress

# Spike test (sudden traffic)
npm run test:load:spike
```

### Test Against Local Server

```bash
# Start server
npm run preview

# Run load test against localhost
k6 run --env BASE_URL=http://localhost:4321 load-tests/okr-api.js
```

### Understanding Results

Key metrics to watch:

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Error Rate | < 1% | < 5% | > 10% |
| p95 Response Time | < 10s | < 15s | > 20s |
| Rate Limited | 0 | < 5 | > 10 |

**Note:** The OKR endpoint calls Claude API, which has 3-10s latency. This is expected.

### Capacity Planning

Based on load testing:

| Scenario | Concurrent Users | Expected Throughput |
|----------|-----------------|---------------------|
| Normal | 10 | ~2 req/sec |
| Peak | 30 | ~5 req/sec |
| Maximum | 50 | Rate limiting active |

## Alerting

### Recommended Alerts

Set up alerts for:

1. **Error Spike** - Error rate > 5% over 5 minutes
2. **Performance Degradation** - LCP p75 > 4s
3. **API Latency** - OKR endpoint p95 > 15s
4. **Availability** - Any 5xx errors

### Uptime Monitoring

Recommended tools:
- [Uptime Robot](https://uptimerobot.com/) - Free tier available
- [Pingdom](https://www.pingdom.com/)
- [Cloudflare Health Checks](https://developers.cloudflare.com/health-checks/)

Monitor these endpoints:
- `https://fyrk.no/` - Homepage
- `https://fyrk.no/okr-sjekken` - OKR tool page

## Dashboard

### Sentry Dashboard

View errors at: `https://sentry.io/organizations/YOUR-ORG/issues/`

Key views:
- **Issues** - Grouped errors
- **Releases** - Errors by version
- **Performance** - Transaction traces

### Web Vitals Dashboard

Access at: `https://fyrk.no/stats` (requires STATS_TOKEN)

Shows:
- Click tracking
- Page views
- Core Web Vitals summary

## Troubleshooting

### Sentry Not Capturing Errors

1. Check `PUBLIC_SENTRY_DSN` is set correctly
2. Verify DSN in browser console: look for Sentry meta tag
3. Check network tab for requests to `ingest.sentry.io`
4. Ensure error isn't being caught and swallowed

### Poor Web Vitals Scores

1. **High LCP**
   - Optimize largest image (hero image)
   - Add `loading="eager"` to above-fold images
   - Preload critical resources

2. **High CLS**
   - Set explicit dimensions on images
   - Reserve space for dynamic content
   - Avoid inserting content above existing content

3. **High FID/INP**
   - Reduce JavaScript bundle size
   - Defer non-critical scripts
   - Break up long tasks

### Load Test Failures

1. **High Error Rate**
   - Check Anthropic API key is valid
   - Verify rate limits aren't exceeded
   - Check for network issues

2. **Rate Limiting**
   - Expected during stress tests
   - Check `Retry-After` header
   - Consider increasing rate limits for testing

## Best Practices

1. **Review errors weekly** - Don't let issues accumulate
2. **Monitor trends** - Watch for gradual degradation
3. **Test before releases** - Run Lighthouse CI on PRs
4. **Load test changes** - Especially API modifications
5. **Set up alerts** - Don't wait for users to report issues
