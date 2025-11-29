# Testing Documentation

## Overview

This project uses Playwright for automated testing with two main test suites:

1. **Smoke Tests** - Daily automated tests for critical user flows
2. **Visual Regression Tests** - Monthly automated tests for visual consistency

## Running Tests Locally

### Prerequisites

```bash
npm install
npm run build
```

### Run All Tests

```bash
npm test
```

### Run Smoke Tests Only

```bash
npm run test:smoke
```

### Run Visual Regression Tests Only

```bash
npm run test:visual
```

### Run Tests with UI

```bash
npm run test:ui
```

## Test Structure

```
tests/
├── homepage.smoke.ts      # Homepage smoke tests
├── contact.smoke.ts       # Contact page smoke tests
├── pages.smoke.ts         # All pages smoke tests
├── homepage.visual.ts     # Homepage visual regression
└── pages.visual.ts        # All pages visual regression
```

## GitHub Actions Workflows

### Daily Smoke Test

- **Schedule:** Every day at 06:00 UTC
- **Manual trigger:** Available via workflow_dispatch
- **Tests:** Critical user flows across desktop, mobile, and tablet
- **Location:** `.github/workflows/smoke-test.yml`

### Monthly Visual Regression

- **Schedule:** First day of each month at 08:00 UTC
- **Manual trigger:** Available via workflow_dispatch
- **Tests:** Visual snapshots across top device/browser configurations
- **Location:** `.github/workflows/visual-regression.yml`

## Test Configuration

Tests are configured in `playwright.config.ts` with separate projects for:

- **Smoke tests:** Desktop Chrome, iPhone 14, iPad Pro
- **Visual regression:** Desktop Chrome, Firefox, Safari, iPhone 14, Pixel 7, iPad Pro

## Adding New Tests

### Smoke Test Example

```typescript
// tests/new-feature.smoke.ts
import { test, expect } from '@playwright/test';

test('new feature works', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Visual Test Example

```typescript
// tests/new-feature.visual.ts
import { test, expect } from '@playwright/test';

test('new feature visual snapshot', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page).toHaveScreenshot('new-feature.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
```

## Updating Visual Baselines

When you make intentional visual changes:

1. Run visual tests locally: `npm run test:visual`
2. Review the differences
3. Update baselines: `npx playwright test --update-snapshots`
4. Commit the updated snapshots

## CI/CD Integration

Tests run automatically:
- **Smoke tests:** Daily at 06:00 UTC
- **Visual regression:** Monthly on the 1st at 08:00 UTC

Both workflows can also be triggered manually from the GitHub Actions tab.

## Troubleshooting

### Tests fail locally

1. Make sure the site is built: `npm run build`
2. Check that Playwright browsers are installed: `npx playwright install`
3. Verify the preview server starts: `npm run preview`

### Visual tests show false positives

- Adjust `maxDiffPixelRatio` in test files if needed
- Review screenshots in `test-results/` directory
- Update baselines if changes are intentional

### CI tests fail

- Check GitHub Actions logs for specific errors
- Verify that the production site (fyrk.no) is accessible
- Ensure all dependencies are listed in `package.json`

