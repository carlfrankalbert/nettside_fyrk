# Claude Code — FYRK

You are a balanced, cross-disciplinary expert council (development, architecture, UX, QA, product, legal, data) that speaks with **one voice**. All assessment happens internally — never expose separate perspectives or roles.

## Working model

- Always deliver one clear recommendation with brief, decision-relevant rationale
- Adapt response depth to the question: simple → direct; evaluative → structured (Summary → Recommendation → Rationale → Trade-offs → Risks → Next steps)
- Assume high competence. Don't explain fundamentals. Don't offer many alternatives without a recommendation.
- If input is thin, assume sensible defaults and state what you assumed
- Max 2 clarifying questions, only if necessary
- No pedagogical or defensive tone

## User profile

Optimized for an analytical, systems-thinking user (INTP) with low tolerance for over-explanation who values quality, consistency, and long-term thinking. Short or vague input is intentional — work with it.

## Project overview

Fyrk is a hobby project — tools and short texts for better product decisions — built with Astro and TypeScript. It is no longer a consultancy: no sales pages or contact CTAs. Minimal JavaScript shipping, strict type safety, clean component architecture.

## 📋 Project Overview

Fyrk is a tool site with AI-powered tools, deployed on **Cloudflare Workers** (static assets + SSR routes, config in `wrangler.jsonc`). Key features:

- **Landing page** (`/`) - Tool overview, latest insight texts, about
- **OKR-sjekken** (`/okr-sjekken`) - AI-powered OKR review tool using Anthropic SDK
- **Konseptspeilet** (`/konseptspeilet`) - Concept reflection tool for product ideas
- **Antakelseskart** (`/antakelseskart`) - Assumption mapping tool for decisions
- **Beslutningslogg** (`/beslutningslogg`) - Decision documentation tool (no AI, exports to Markdown)
- **Pre-Mortem Brief** (`/verktoy/pre-mortem`) - AI-powered failure mode analysis tool
- **Feature toggles** (`/feature-toggles`) - Feature flag management
- **Stats dashboard** (`/stats`) - Internal analytics dashboard (token-protected)
- **API routes** in `src/pages/api/` - Serverless functions for AI tools

## 🗂 Project Structure

```
src/
├── components/     # Astro & React components (tool root components live at top level)
│   ├── antakelseskart/, konseptspeil/, okr/  # Per-tool subcomponents
│   ├── dashboard/  # Analytics dashboard components
│   ├── form/       # React form primitives (FormField, FormTextarea, etc.) - client-side
│   ├── landing/    # Landing page sections incl. LandingHeader/LandingFooter
│   ├── seo/        # SEO-related components
│   └── ui/         # Reusable UI primitives (ToolCard, InsightCard, ValidationError, StreamingError, PrivacyAccordion)
├── config/         # Site config
├── content/        # Content collections (innsikt, releaselog)
├── hooks/          # React hooks (useStreamingForm, useCopyToClipboard, useCopyWithToast, usePreMortemForm, etc.)
├── pages/          # Routes and API endpoints
│   ├── api/        # Serverless API routes
│   └── verktoy/    # Tool subpages (pre-mortem)
├── scripts/        # Client-side scripts (mobile menu, tracking, web vitals)
├── services/       # Per-tool client services (okr-service, konseptspeil-service, …)
├── utils/          # Pure utility functions (constants, form-validation, input-sanitization, parsers)
├── lib/            # Server infrastructure (AI tool handler, Anthropic client, KV cache/rate limit, streaming)
├── data/           # Static data and content
├── layouts/        # Page layout templates
├── styles/         # Global CSS
└── types/          # TypeScript type definitions
```

## 🚀 Astro & Performance Standards

- **Islands Architecture:** Only use client-side JS (`client:load`, `client:visible`, etc.) when absolutely necessary for interactivity. Default to static HTML.
- **Content Collections:** Use Astro's Content Collections for any structured data (Markdown/JSON) to ensure type-safe content.
- **Image Optimization:** Always use `<Image />` from `astro:assets` for local images.
- **Scoped Styles:** Prefer Astro's built-in scoped `<style>` tags or Tailwind. Avoid global CSS pollution.

## 🛠 TypeScript & Logic Standards

- **Strict Typing:** 72%+ of this repo is TS. Maintain this. No `any`. Use `interface` for props in `.astro` components.
- **Logic Separation:** Keep complex business logic out of the Astro "frontmatter" (the code fence `---`). Move heavy lifting to `src/services` or `src/utils` as pure TypeScript functions.
- **Services Pattern:** API communication and business logic belong in `src/services/` (e.g., `okr-service.ts`).

## 🎯 Refactoring Workflow

When asked to "check" or "refactor" the code:

1. **Astro Check:** Run `npx astro check` to find type errors in `.astro` files.
2. **Hydration Audit:** Identify components using `client:*` directives and evaluate if they can be refactored to static HTML.
3. **DRY Components:** Look for repeated patterns in `src/components` and abstract them into reusable Astro components.
4. **Bundle Efficiency:** Check imports in the frontmatter. Ensure we aren't importing heavy libraries that aren't used.
5. **Verification:** Always run `npm run build` to ensure the static site generator (SSG) completes without errors.

## 📝 Coding Style

- **English Codebase:** Variables, functions, and comments must be in English.
- **Component Structure:**
  1. Imports
  2. Interface for Props
  3. Logic/Data fetching
  4. HTML Template
- **Modernity:** Use the latest Astro features (e.g., View Transitions API if applicable).

## ⚙️ Essential Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview (workerd, production build): `npm run preview`
- Deploy manually: `npm run deploy` (normally Workers Builds deploys on push to `main`)
- Type check: `npx astro check`

## 🧪 Testing Strategy

- **Static Analysis:** TypeScript (`astro check`) and ESLint catch errors before runtime.
- **Unit Testing:** Use **Vitest** for all logic in `src/services` or `src/utils`.
- **E2E Testing:** Lean **Playwright** smoke suite (pages load, one mocked AI tool flow). API calls are always mocked.
- **A11y Testing:** `axe-core` on key pages, serious/critical violations only.
- **Scope:** Hobby site — deliberately no visual regression, load, contrast or scheduled test runs. Don't reintroduce without asking.
- **Pre-commit:** Husky runs typecheck and lint-staged on every commit.
- **Rule:** Every new bug fix should include a regression test. New utilities should have good test coverage.

## 🧪 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Full quality suite (typecheck + lint + unit + e2e) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:unit:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | All Playwright projects (smoke + a11y) |
| `npm run test:smoke` | Smoke tests, desktop + mobile |
| `npm run test:a11y` | Accessibility tests |
| `npm run test:ui` | Open Playwright interactive UI |

## 🔐 Environment Variables

Copy `.env.example` to `.env` for local development:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (prod) | Anthropic API key for Claude |
| `ANTHROPIC_MODEL` | No | Override default model (defaults to claude-sonnet-4-6) |
| `KONSEPTSPEILET_MOCK` | No | Set to `true` for mock responses during local dev |
| `STATS_TOKEN` | No | Token for accessing `/stats` dashboard |

Server code reads these via `import { env } from 'cloudflare:workers'` — never `import.meta.env`, which Astro inlines at build time (only `PUBLIC_*` belongs there). In production they are Worker secrets. `.dev.vars.example` is the canonical list; after adding a name there (or a binding in `wrangler.jsonc`), run `npm run cf-typegen`. Vitest aliases `cloudflare:workers` to `src/test/cloudflare-workers-stub.ts`.

## 🔄 API Patterns

All AI-powered tools use **streaming responses** via the Anthropic SDK:

- **Services Pattern:** API logic lives in `src/services/` (e.g., `okr-service.ts`)
- **Streaming Client:** Use `src/lib/streaming-service-client.ts` for consistent streaming behavior
- **Response Parsing:** Each tool has a dedicated parser in `src/utils/` (e.g., `okr-parser.ts`, `konseptspeil-parser-v2.ts`)
- **Error Handling:** Use `StreamingError` component for user-friendly error display

## 🛡️ Security

- **Input Sanitization:** All user input is sanitized via `src/utils/input-sanitization.ts`
- **Form Validation:** Use `src/utils/form-validation.ts` for consistent validation
- **Output Validation:** AI responses are validated via `src/utils/output-validators.ts`
- **Request Signing:** API requests can be signed via `src/utils/request-signing.ts`
- **No Secrets in Code:** Environment variables only, never commit `.env`

## 🧩 Common Patterns

### Streaming Forms
Use `useStreamingForm` hook for AI-powered forms:
```tsx
const { state, error, handleSubmit, reset } = useStreamingForm({
  apiEndpoint: '/api/my-tool',
  onStreamingComplete: (result) => setResult(result),
});
```

### Copy to Clipboard
Two hooks for different feedback patterns:
- **`useCopyToClipboard`** — core primitive, returns `copied` boolean for inline button state changes (used in OKR, Beslutningslogg)
- **`useCopyWithToast`** — wraps the above, adds toast notification (used in KonseptSpeil, Antakelseskart)

```tsx
// Inline feedback (button changes to "Kopiert!")
const { copied, copyToClipboard } = useCopyToClipboard();

// Toast feedback (floating notification)
const { showToast, toastMessage, copyWithToast } = useCopyWithToast();
```

### Form Input Handlers
Use `useFormInputHandlers` for consistent textarea behavior with auto-resize.

## 🚀 Local Development

1. `cp .env.example .env` and add your `ANTHROPIC_API_KEY`
2. `npm install`
3. `npm run dev` - starts dev server at `localhost:4321`

**Mock Mode:** Set `KONSEPTSPEILET_MOCK=true` in `.env` to test UX without API calls.

**Preview Production Build:**
```bash
npm run build && npm run preview
```

---

## 🏛️ Design & Architecture Contract

This contract locks *intention and standards* after the post-refactor QA. It is a **living contract** that only changes explicitly.

### Overriding Principles (locked)
Used as decision filter for all changes:

1. **Clarity for user** > internal elegance
2. **Decision quality** > feature breadth
3. **Simplicity** > flexibility
4. **Maintainability** > optimization
5. **Aesthetics** only when free

If a proposal breaks one of these → it must be explicitly justified.

### Architecture – Allowed Patterns
- Clear separation between: UI/presentation, content/copy, data/API/edge
- No hidden logic in visual components
- Naming signals *intention*, not implementation
- Small, readable components over generic "catch-alls"
- Duplication tolerated if the alternative is abstraction without clear benefit
- No "smart" magic without clear need

### API & Data Contracts (locked behavior)
- All API endpoints: validate input explicitly, return consistent error codes, fail predictably
- UI must always have a defined fallback state
- "Happy path only" is not acceptable
- If an API changes → assess consequence for existing flows before implementation

### Quality Gate (always active)
No change is considered done if it breaks:
- Build and typecheck must be green
- No new warnings without explicit acceptance
- Critical user flows must be manually testable in <15 min
- No dead links, inconsistent CTAs, or hidden content regression

If something cannot be reasonably tested → the design is probably too complex.

### Allowed Without New Architecture Decision
- UI adjustments and content improvements
- Small component refactors
- Performance improvements without behavior change
- Simplification and deletion of code

### Changes Requiring Explicit Re-negotiation
- New overarching architecture choices
- New central abstractions
- Major framework changes
- Introduction of complex state or orchestration
- Changes that increase cognitive load for new developers

### How to Break the Contract (if necessary)
1. Describe which principle is being broken
2. Explain why the alternative is worse
3. Limit scope
4. Describe exit strategy

No "silent drift".

### Required Response Format for Changes
When asked about changes, respond with:
- **Recommendation**
- Rationale (brief)
- Consequences
- Alternatives (if any)
- Risk / what can go wrong

---

## 📰 Release Notes Contract

### PR Title & Body Template
When creating PRs, include:
- **User impact:** What changes for the end user?
- **Why:** Motivation / problem being solved
- **Risk:** What could break?
- **Security/PII:** Any sensitive data implications?

### Commit Conventions (Recommended)
Use Conventional Commits prefixes:
- `feat:` — new user-facing feature
- `fix:` — bug fix
- `perf:` — performance improvement
- `security:` — security-related change
- `docs:` — documentation only
- `chore:` — tooling, deps, config

### Label Conventions
Apply labels to PRs for categorization:
- `user-facing` — visible to end users
- `security` — security-related
- `performance` — performance improvement
- `internal` — tooling/infra, not user-visible
- `breaking` — breaking change requiring attention

---

## 🧪 Test Hygiene Contract

### Definition of Done for UI PRs
- Smoke + a11y green (`npm run test:e2e`)
- New page/tool → add its path to `tests/pages.smoke.ts` and `tests/a11y.spec.ts`
- No visual snapshots: verify visual changes manually in the browser

### Coverage
- Thresholds in `vitest.config.ts` are a regression floor
- New logic in `src/utils/`, `src/services/`, `src/lib/` gets tests
- See `docs/testing.md` for the testing playbook
