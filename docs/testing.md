# Testing Playbook

FYRK is a hobby tool site. The suite is deliberately lean: it catches broken
builds, broken logic and broken pages. It does not police pixels, contrast
ratios or load capacity.

## Layers

| Layer | Command | Covers |
|-------|---------|--------|
| Static | `npm run typecheck`, `npm run lint` | Types, code style |
| Unit | `npm run test:unit` | Logic in `src/utils`, `src/services`, `src/lib`, `src/hooks` (Vitest) |
| Smoke | `npm run test:smoke` | Every page loads, homepage sections, one mocked AI tool flow, API input validation. Desktop + mobile (Pixel 7) |
| A11y | `npm run test:a11y` | axe-core, serious/critical WCAG 2.1 AA violations, keyboard reach on OKR-sjekken |

`npm test` runs all of it. `npm run test:e2e` runs all Playwright projects.

## Files

| File | Project |
|------|---------|
| `tests/pages.smoke.ts` | smoke, smoke-mobile |
| `tests/tool-flow.smoke.ts` | smoke, smoke-mobile |
| `tests/a11y.spec.ts` | a11y |

AI calls are always mocked with `page.route`. Never hit the real API from tests.

## CI

`ci.yml` runs on PRs and pushes to `main`: security audit (non-gating),
typecheck + lint + unit, build, then all Playwright projects on Chromium.
There are no scheduled workflows.

## Rules of thumb

- Bug fix in logic → add a Vitest regression test next to the code.
- New tool page → add its path to `TOOL_PAGES` in `pages.smoke.ts` and to `a11y.spec.ts`.
- Coverage thresholds in `vitest.config.ts` are a regression floor, not a target.
- Prefer `getByRole()`, then `data-testid`, over CSS selectors.

## Local gotcha

Playwright **reuses** whatever already listens on port 4321. A stale dev server
from an earlier session gets tested instead of a fresh one (symptom: "file does
not exist … in the optimize deps directory"). Astro 7 detaches `astro dev` when
an AI agent starts it. Check with `npx astro dev status`, stop with
`npx astro dev stop`.
