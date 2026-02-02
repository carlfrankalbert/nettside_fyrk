# Test Suite

E2E and integration tests using Playwright. Unit tests live in `src/` alongside source code (Vitest).

## Test Files

| File | Project | Description |
|------|---------|-------------|
| `pages.smoke.ts` | smoke | Critical user flows (all pages) |
| `contact.smoke.ts` | smoke | Contact section verification |
| `error-pages.smoke.ts` | smoke | 404/500 error handling and redirects |
| `pages.visual.ts` | visual | Desktop visual regression snapshots |
| `mobile.visual.ts` | visual-mobile | Mobile visual regression snapshots |
| `mobile.ux.ts` | ux-mobile | Mobile UX (touch targets, text size) |
| `a11y.spec.ts` | a11y | Accessibility (axe-core, WCAG AA) |
| `contrast.spec.ts` | — | WCAG color contrast checks |
| `security.spec.ts` | security | OWASP security headers, XSS prevention |
| `okr-sjekken.spec.ts` | okr-api | OKR API validation and rate limiting |
| `konseptspeilet.spec.ts` | konseptspeilet | Konseptspeilet API tests |
| `pre-mortem.spec.ts` | — | Pre-Mortem API tests |
| `streaming-resilience.spec.ts` | — | Streaming error handling |
| `typography.spec.ts` | — | Typography and readability checks |
| `theme-toggle.spec.ts` | theme | Dark/light mode toggle |

## Running Tests

```bash
# Full quality suite (typecheck + lint + unit + e2e)
npm test

# E2E smoke tests (desktop + mobile + tablet)
npm run test:smoke

# Specific test suites
npm run test:a11y          # Accessibility
npm run test:visual        # Visual regression (desktop)
npm run test:mobile        # Visual + UX mobile
npm run test:theme         # Dark/light mode
npm run test:okr-api       # OKR API tests
npm run test:konseptspeilet # Konseptspeilet API tests

# Unit tests
npm run test:unit
npm run test:unit:watch
npm run test:unit:coverage

# Interactive UI
npm run test:ui

# Run specific file
npx playwright test tests/pages.smoke.ts --project=smoke
```

## Visual Regression

Visual tests compare screenshots against approved baselines in `tests/__snapshots__/`.

To update baselines after intentional design changes:

1. Run `npm run test:visual` and review diffs in `test-results/`
2. Update: `npx playwright test --update-snapshots`
3. Commit updated snapshots with the code change

## CI Integration

Tests run in GitHub Actions:
- **ci.yml** — typecheck, lint, unit, e2e on push/PR
- **smoke-test.yml** — post-deploy verification
- **visual-regression.yml** — visual diff on PRs
- **contrast-test.yml** — color contrast on PRs
