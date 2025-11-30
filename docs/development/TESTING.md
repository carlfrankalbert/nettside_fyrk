# Testing Documentation

## Visual Testing Philosophy

Our testing approach follows a clear separation of concerns:

- **Functional tests verify *presence*** (element exists)
  - Smoke tests check that critical elements are present and functional
  - They verify that the page loads, navigation works, and key content is visible
  - Example: "The contact form is visible and accessible"

- **Visual regression tests verify *appearance*** (element looks correct)
  - Visual tests capture screenshots and compare them against approved baselines
  - They detect any visual changes, whether intentional or unintentional
  - Example: "The homepage hero section matches the approved design"

- **Baseline screenshots represent the approved design**
  - Baseline screenshots in `tests/__snapshots__/` are the source of truth
  - These represent the design that has been reviewed and approved
  - Any deviation from baseline indicates a potential issue or intentional change

- **Any visual deviation from baseline must be reviewed and either fixed or approved as new baseline**
  - When visual tests fail, the difference must be investigated
  - If the change is unintentional (bug), it must be fixed
  - If the change is intentional (new design), the baseline must be updated after review

## Overview

This project uses Playwright for automated testing with two main test suites:

1. **Smoke Tests** - Daily automated tests for critical user flows (verify presence)
2. **Visual Regression Tests** - Monthly automated tests for visual consistency (verify appearance)

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

1. **Make your design changes** to the codebase
2. **Run visual tests locally**: `npm run test:visual`
3. **Review the differences** in the test results:
   - Check the diff images in `test-results/` to see what changed
   - Verify that the changes match your intended design
4. **Get approval** (if required by your team's process):
   - Ensure the new visual state is reviewed and approved
   - Document the reason for the visual change
5. **Update baselines**: `npx playwright test --update-snapshots`
   - This replaces the old baseline with the new approved design
   - Only run this after confirming the changes are intentional and correct
6. **Commit the updated snapshots** along with your code changes
   - The new baseline screenshots become the new source of truth

**Important**: Never update baselines without reviewing the visual differences first. The baseline represents the approved design, so updating it should be a deliberate decision.

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

- **Review the diff images** in `test-results/` directory to see what changed
- **Determine if the change is intentional or a bug**:
  - If it's a bug: Fix the code and re-run tests
  - If it's intentional: Follow the "Updating Visual Baselines" process above
- Adjust `maxDiffPixelRatio` in test files only if needed for minor rendering differences
- **Never ignore visual test failures** - they indicate a deviation from the approved design

### Visual tests fail in CI

When visual regression tests fail in GitHub Actions:

1. **Download the visual diff artifacts** from the workflow run
2. **Review the differences** in the uploaded screenshots
3. **Determine the cause**:
   - **Unintentional change (bug)**: Fix the code, commit, and push
   - **Intentional change (new design)**: 
     - Update baselines locally: `npx playwright test --update-snapshots`
     - Commit the updated baselines with your code changes
     - Push to trigger a new test run
4. **Document the change** in your commit message or PR description

### CI tests fail

- Check GitHub Actions logs for specific errors
- Verify that the production site (fyrk.no) is accessible
- Ensure all dependencies are listed in `package.json`

