# Modernization plan

Assessed 2026-09-23. This plan sequences the work needed to bring fyrk.no
current. It is ordered by dependency, not by appetite: several items are
blocked by the one below them.

## Assessment

The code is not the problem.

| Measure | Value |
|---------|-------|
| Source | 25 536 lines, 67 components, 19 pages, 9 API routes |
| Largest file | 457 lines (`src/lib/ai-tool-handler.ts`) |
| `any` / `@ts-ignore` | 1 |
| TODO / FIXME / HACK | 0 |
| Hydration directives | 6 (`client:load` ×5, `client:visible` ×1) |
| Coverage | services 96%, utils 73%, lib 39%, hooks 0% |

No god objects, no circular dependencies, no dead abstractions, and islands
discipline is intact. A broad refactor here would violate the design
contract's own principle that duplication is tolerated when the alternative is
abstraction without clear benefit. The debt is in platform currency, in test
coverage of the AI plumbing, and in one environment problem.

## Tracks

### 1. Repository location — do this first, it is 20 minutes

The repo lives under `~/Desktop`, which iCloud syncs. iCloud is actively
creating duplicates of source files: `postcss.config 2.mjs` and
`src/content.config 2.ts` exist right now. They are untracked, but `git add -A`
is one habit away from committing a second Astro content config. This is also
the cause of the recurring npm `ENOTEMPTY` install failures.

Move the repository out of `~/Desktop` (e.g. `~/code/fyrk`). Everything below
gets easier and less flaky afterwards.

**Risk:** none. **Blocks:** nothing, but makes every other track less painful.

### 2. Minor and patch currency — low risk, do continuously

React 19.2.8 → 19.3, Playwright 1.62 → 1.63, `@typescript-eslint` 8.68 → 8.70,
happy-dom, `@astrojs/sitemap` 3.7.3 → 3.7.4, wrangler 4.136 → 4.137.

Add an `engines` field (`node >= 22`) so the version the project needs is
declared rather than implied, and move CI from Node 20 to Node 22 — Astro 7
requires it, and moving now decouples the runtime bump from the framework bump.

**Risk:** low, CI covers it. **Blocks:** track 4.

### 3. Test the AI plumbing — highest value per hour — IN PROGRESS

`lib/` sits at 39% while it holds the code most likely to break in production:
`ai-tool-handler.ts` (457 lines), `slo-monitoring.ts` (349), `anthropic-client.ts`,
`cache.ts` (61%). `hooks/` is at 0%. `utils/debounce.ts` and
`utils/request-utils.ts` are untested entirely.

These are pure additions — no production code changes, so no deployment risk.
Raise the coverage floor from 35% only after the tests land, and raise it to
what was actually achieved, not to an aspiration.

**Risk:** none. **Blocks:** nothing. **Do this while tracks 4 and 5 are being planned.**

**Done so far:** overall 51% → 60%, lib 39% → 55%, hooks 0% → 21%, 526 → 592
tests. Covered: the request gates in `ai-tool-handler` (content type, origin,
body shape, input length, mock mode), `validate-origin`, `streaming-response`,
`structured-logger`, `request-utils`, `debounce`, `useCopyToClipboard`,
`useCopyWithToast`. Thresholds raised to match.

**Still open:** `slo-monitoring.ts` (0%), `useStreamingForm.ts` (303 lines, 0%),
`usePreMortemForm.ts`, `useFormInputHandlers.ts`, `analytics-helpers.ts` (0%),
`kv-circuit-breaker.ts` (62%), `cache.ts` (61%).

### 4. Astro 5 → 7, which is a hosting migration

This is the one that matters, and it is not a dependency bump. Astro 7 requires
`@astrojs/cloudflare` 14, which **dropped Cloudflare Pages support**. It means:

- A Cloudflare **Workers** project replaces the Pages project
- KV bindings move into Wrangler config
- `Astro.locals.runtime` is removed — used in `lib/anthropic-client.ts`,
  `stats.astro`, `beta.astro`, `feature-toggles.astro`
- Build output moves from `dist/` to `dist/client` + `dist/server`
- The custom domain `fyrk.no` moves to the Workers project
- Node 22 minimum (track 2)

The content layer migration and the move off `@astrojs/tailwind` are already
done (PR #171), so the remaining work is the platform, not the framework.

Clears both accepted advisories in `docs/security/dependency-audit.md` and makes
`Security Audit` green again.

**Sequence it as:** Workers project alongside the live Pages project → deploy
the branch to a `*.workers.dev` URL → verify against it with the existing
Playwright suites → move the custom domain → delete the Pages project.

**Risk:** high if the domain moves before verification; low if it moves last.
**Blocked by:** track 2.

### 5. Tailwind 3 → 4

`@astrojs/tailwind` is already gone; Tailwind now runs through PostCSS, so this
is decoupled from track 4 and can happen before or after it. Tailwind 4 moves
configuration from `tailwind.config.mjs` to CSS-first `@theme`, which means
re-declaring the brand colour tokens, and it changes several utility defaults.

**Do it as its own PR with visual baselines regenerated in the same PR** — that
is what the visual regression workflow is now for.

**Risk:** medium, entirely visual. **Blocks:** nothing.

### 6. Tooling majors — batch when convenient

ESLint 9 → 10, TypeScript 5 → 7, Vitest 4 → 5, lint-staged 16 → 17,
`lucide-react` 0.563 → 1.x, `@anthropic-ai/sdk` 0.120 → 0.128,
`@cloudflare/workers-types` 4 → 5 (drop the v4 pin and switch to
`wrangler types` as part of track 4).

**Risk:** low, none of it reaches production output except `lucide-react`.

### 7. Smaller items

- `?token=` in the URL for `/stats`, `/beta`, `/feature-toggles` puts tokens in
  CDN and server logs. `/stats` already migrates to an httpOnly cookie after the
  first hit; decide whether the other two should, or whether query-token auth
  goes away entirely.
- The PR labels the release-notes contract refers to (`user-facing`, `internal`,
  `security`, `performance`, `breaking`) do not exist in the repository.
- The `/stats` dashboard ships 416 KB of JavaScript (recharts). It is
  token-protected and internal, so this is a comfort issue, not a user-facing
  one — but it is the only heavy bundle in the project.
- `deploy-test.yml` is the last GitHub Pages workflow. Decide whether
  test.fyrk.no is a live environment or the workflow should go.

## Order

```
1 repo location ──┐
                  ├──> 3 tests (parallel, no dependencies)
2 minor + Node 22 ─┴──> 4 Astro 7 + Workers ──> 6 tooling majors
                        5 Tailwind 4 (independent)
                        7 smaller items (independent)
```

## Guardrails

One track per pull request. Every track keeps the quality gate green: typecheck,
lint, unit, build, and the Playwright suites that now actually run against the
pull request's own code. A track that cannot be verified before it reaches
production — track 4 is the only one — gets a staging URL first.
