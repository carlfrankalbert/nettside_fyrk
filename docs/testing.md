# Testing Playbook

## Test suites

| Suite | Command | Purpose | When to run |
|-------|---------|---------|-------------|
| Unit | `npm run test:unit` | Logic in utils/services/lib | Every change |
| Unit + coverage | `npm run test:unit:coverage` | Same + coverage report | Before PR |
| Smoke | `npx playwright test --project=smoke` | Key routes render, nav and contact links intact | Every change |
| Smoke (deployed) | `PLAYWRIGHT_TEST_BASE_URL=https://fyrk.no npx playwright test --project=smoke` | Same, plus host-level 404 handling | After deploy |
| Visual | `npx playwright test --project=visual` | Screenshot comparison | After UI changes |
| Mobile UX | `npx playwright test --project=ux-mobile` | Touch targets, spacing | After mobile changes |
| A11y | `npm run test:a11y` | axe-core violations | After UI changes |

## What tests run against

Playwright starts a local server and tests that, so a pull request is verified
by its own code. Only the workflows that check the live site set
`PLAYWRIGHT_TEST_BASE_URL=https://fyrk.no` — the Daily Smoke workflow, and any
local run where you pass it yourself. Blocks that assert host behavior (how
unmatched routes are served) skip unless such a URL is set.

Locally, Playwright **reuses** whatever already listens on port 4321. A dev
server left running from an earlier session is tested instead of a fresh one,
with its own Vite cache — failures like "file does not exist … in the optimize
deps directory" come from that. Astro 7 detaches `astro dev` when an AI agent
starts it, so such servers outlive the session. Check with `npx astro dev status`
and stop with `npx astro dev stop`.

## Updating visual snapshots

When you intentionally change the UI:

```bash
# Update all visual baselines locally
npx playwright test --update-snapshots --project=visual --project=visual-mobile

# Or update from CI (generates Linux baselines)
gh workflow run "Monthly Visual Regression" -f update_snapshots=true
```

Commit the updated `.png` files in the same PR as your UI change.

## Interpreting visual diff artifacts

When visual tests fail in CI:
1. Download the `visual-regression-report` artifact from the Actions run
2. Open `playwright-report/index.html`
3. Click on the failed test to see the diff image
4. If the change is intentional: update snapshots
5. If the change is unintentional: fix the regression

## Selector conventions

Prefer stable locators in this order:
1. `getByRole()` — most resilient, tests accessibility
2. `data-testid` — for complex UI where roles aren't enough
3. CSS class selectors — avoid for assertions, ok for scoping

Naming convention for test IDs: `data-testid="section-element"` (e.g., `hero-cta`, `nav-menu-toggle`).

## Coverage thresholds

Current thresholds (in `vitest.config.ts`):
- Lines: 35%
- Statements: 35%
- Functions: 35%
- Branches: 35%

If you add new files to `src/utils/`, `src/services/`, or `src/lib/`, add tests to maintain coverage.

## CI workflows

| Workflow | Schedule | What it checks |
|----------|----------|----------------|
| Daily Smoke | 06:00 UTC daily | Production health (smoke + UX + contrast) |
| Monthly Visual | 1st of month 08:00 UTC | Visual regression across browsers/devices, against the checked-out ref |
| Nightly Full Suite | 03:00 UTC daily | Typecheck + lint + unit coverage + E2E |

## Flake prevention

Visual tests use these stabilization techniques:
- `waitForLoadState('networkidle')` before screenshots
- `maxDiffPixelRatio: 0.01` tolerance (1% pixel diff allowed)
- Project-name-based snapshot paths (no OS suffix)
- CI generates baselines on Linux via workflow dispatch
