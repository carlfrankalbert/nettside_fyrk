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

### 1. Repository location — DONE

The repo lives under `~/Desktop`, which iCloud syncs. iCloud is actively
creating duplicates of source files: `postcss.config 2.mjs` and
`src/content.config 2.ts` exist right now. They are untracked, but `git add -A`
is one habit away from committing a second Astro content config. This is also
the cause of the recurring npm `ENOTEMPTY` install failures.

Move the repository out of `~/Desktop` (e.g. `~/code/fyrk`). Everything below
gets easier and less flaky afterwards.

**Risk:** none. **Blocks:** nothing, but makes every other track less painful.

**Done 2026-09-23:** moved to `~/code/nettside_fyrk`.

### 2. Minor and patch currency — DONE (keep doing it continuously)

React 19.2.8 → 19.3, Playwright 1.62 → 1.63, `@typescript-eslint` 8.68 → 8.70,
happy-dom, `@astrojs/sitemap` 3.7.3 → 3.7.4, wrangler 4.136 → 4.137.

Add an `engines` field (`node >= 22`) so the version the project needs is
declared rather than implied, and move CI from Node 20 to Node 22 — Astro 7
requires it, and moving now decouples the runtime bump from the framework bump.

**Risk:** low, CI covers it. **Blocks:** track 4.

**Done:** PR #175 (minors current, `engines`, CI on Node 22).

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

**Still open:** `useStreamingForm.ts` (303 lines, 0%),
`analytics-helpers.ts` (0%), `kv-circuit-breaker.ts` (62%), `cache.ts` (61%).

**2026-09-24:** `useFormInputHandlers` and `usePreMortemForm` (+ `useMobileSync`)
covered — hooks 21% → 54%, overall 60% → 65% lines; thresholds raised to match.

### 4. Astro 5 → 7, which is a hosting migration — DONE

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

**Done 2026-09-24** (PR #183, #185). fyrk.no and www.fyrk.no are served by the
`nettside-fyrk` Worker; `npm audit` reports 0 vulnerabilities. What differs from
the plan above, and why:

- Server code reads bindings and secrets via `import { env } from
  'cloudflare:workers'`. The `import.meta.env` fallback for secrets is gone —
  Astro 6+ inlines it at build time.
- `wrangler types` generates only the `Env` type (`npm run cf-typegen`).
  Runtime types stay on `@cloudflare/workers-types` v5: the generated runtime
  types declare a global `ImageMetadata` that collides with Astro's.
- Custom domains are declared in `wrangler.jsonc`; the dashboard flow failed to
  create `www.fyrk.no`. `www` → apex is a Cloudflare Redirect Rule, because
  static assets are served before the Worker runs.
- Trailing-slash redirects are 307 on Workers (308 on Pages). Canonical tags
  point at the slash URL, so this was accepted.
- **Still open:** delete the paused Pages project after 2026-10-01 (#187). Until
  then it is the rollback: move the two domains back to it.

### 5. Tailwind 3 → 4 — DONE

**Done 2026-09-25**, with the rendered site kept identical to v3. Migrated with
`@tailwindcss/upgrade`: theme in the `@theme` block of `src/styles/global.css`
(no `tailwind.config.mjs`), class-based dark mode as a `@custom-variant`,
utilities renamed for v4's shifted scales. Tailwind runs as the
`@tailwindcss/vite` plugin (the PostCSS plugin broke the Inter font URLs).

v4 changes that would have altered the look, and how `global.css` neutralises
them (each is commented in place):

- `text-xs/sm/base/lg` get their own line heights in v4 → cleared in `@theme`
- an explicit `leading-*` now beats a breakpoint `text-*` size → six intro
  paragraphs got `md:leading-7/8`
- base-layer `@apply leading-*` sets `--tw-leading` → plain `line-height`
- `space-y` moved the gap to `margin-bottom` → `@utility space-y-*` override with
  v3 semantics; the default `p` margin lives in the utilities layer
- preflight: placeholder colour, button cursor, date-field padding, default
  border colour → restored
- OKLCH default palette → v3 values pinned for the colour families in use

Verified by comparing element geometry and computed colours on all 76 routes at
1280px and 390px against the v3 site: identical, except a `divide-y` border that
moved between boxes (pixel-identical on screen).

### 6. Tooling majors — DONE except TypeScript 7

**Done 2026-09-24:** ESLint 10 (+ `@eslint/js` 10, `eslint-plugin-astro` 3),
TypeScript 6, lint-staged 17, `lucide-react` 1.x (all icons in use still exist),
`@anthropic-ai/sdk` 0.127, `@cloudflare/workers-types` 5.

**Still open:** TypeScript 7 — blocked until `@astrojs/check` supports it (it
declares `typescript: ^5 || ^6`). Vitest 5 when it ships.

**Risk:** low, none of it reaches production output except `lucide-react`.

### 7. Smaller items

- ~~`?token=` in the URL for `/stats`, `/beta`, `/feature-toggles`~~ — done
  2026-09-24. `src/lib/token-cookie.ts` exchanges a URL token for an httpOnly
  cookie and redirects to the clean URL (`/stats`, `/feature-toggles`); the
  `/api/feature-toggles` save uses that cookie, so the token is no longer
  written into the page. `/beta?token=` stays the invite link but redirects to
  `/beta?activated=1` after setting the beta cookie.
- ~~PR labels for the release-notes contract~~ — created 2026-09-24.
- The `/stats` dashboard ships 416 KB of JavaScript (recharts). It is
  token-protected and internal, so this is a comfort issue, not a user-facing
  one — but it is the only heavy bundle in the project.
- ~~`deploy-test.yml` / test.fyrk.no~~ — removed 2026-09-24. No DNS record existed,
  the workflow only ran on the deleted `develop` branch; Workers preview URLs
  cover staging.
- The Pixel 7 homepage visual baselines are stale since #173 (a copy change),
  so the visual workflow fails on `main`. Regenerate them.
- The `okr-api` and `security` Playwright projects fail on `main`: `okr-api`
  asserts the old English error message, `security` expects 429/415 where the
  API returns other codes. Neither runs in CI, which is why nobody noticed.

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
