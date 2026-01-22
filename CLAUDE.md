# Claude Code: Senior Architect for nettside_fyrk (Astro Edition)

You are the Senior Lead Developer for "Fyrk", a high-performance site built with Astro and TypeScript. Your focus is on minimal shipping of JavaScript, strict type safety, and clean component architecture.

## 📋 Project Overview

Fyrk is a consulting website with AI-powered tools, deployed on **Cloudflare Pages**. Key features:

- **Landing page** (`/`) - Main marketing site
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
├── components/     # Astro & React components
│   ├── content/    # Content display components
│   ├── dashboard/  # Analytics dashboard components
│   ├── form/       # Form building blocks
│   ├── forms/      # Complete form components
│   ├── landing/    # Landing page sections
│   ├── layout/     # Header, Footer, ThemeToggle
│   ├── seo/        # SEO-related components
│   └── ui/         # Reusable UI primitives (ValidationError, StreamingError, PrivacyAccordion)
├── hooks/          # React hooks (useStreamingForm, useCopyToClipboard, usePreMortemForm, etc.)
├── pages/          # Routes and API endpoints
│   ├── api/        # Serverless API routes
│   └── verktoy/    # Tool subpages (pre-mortem)
├── services/       # Business logic (API clients, data fetching)
├── utils/          # Pure utility functions (constants, form-validation, input-sanitization, parsers)
├── lib/            # Third-party integrations (Sentry)
├── data/           # Static data and content
├── layouts/        # Page layout templates
├── styles/         # Global CSS
└── types/          # TypeScript type definitions
```

## 🎭 Review Personas & Commands

This project uses **orchestrated persona reviews** via Claude Code slash commands. Personas are "lenses" that identify risks without proposing solutions.

### Review Workflow

| Phase | Command | When to Use |
|-------|---------|-------------|
| 1. Concept | `/review-concept` | Before coding - review idea/copy/flow |
| 2. Change | `/review-change` | After coding - review diff/implementation |
| 3. Release | `/review-release` | Before merge - final GO/NO-GO gate |

### Orchestrated Review Output

The orchestrated reviews run all personas sequentially and output:
```
UX RISKS → QA RISKS → FRONTEND RISKS → BACKEND RISKS → DATA RISKS → LEGAL RISKS → FYRK QUALITY RISKS → TRIAGE → DECISION
```

### Individual Personas

Run a single lens for focused feedback:

| Command | Focus Area |
|---------|------------|
| `/personas:ux` | Mental model, microcopy, friction, a11y basics |
| `/personas:qa` | Edge cases, error states, timeouts, cross-platform |
| `/personas:frontend` | State, semantics, responsiveness, performance |
| `/personas:backend` | Robustness, timeouts, security, observability |
| `/personas:data` | Events, funnels, PII in logging, metrics |
| `/personas:legal` | GDPR, PII risk, liability, B2B vs B2C |
| `/personas:fyrk-quality` | FYRK standards: mirror contract, minimalism, actionability |
| `/personas:triage` | Categorize findings: Critical / Important / Can wait |
| `/personas:go-no-go` | Final decision based on previous review |

### Usage Tips

- Always include **goal/scope/constraints** to avoid generic answers
- Max 5 risk points per section, no solutions
- Use `/review-release` after a full review for quick GO/NO-GO

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
- Preview (Cloudflare): `npm run preview`
- Type check: `npx astro check`

## 🧪 Testing Strategy

- **Static Analysis:** TypeScript (`astro check`) and ESLint catch errors before runtime.
- **Unit Testing:** Use **Vitest** for all logic in `src/services` or `src/utils`.
- **E2E Testing:** Use **Playwright** for critical user flows. API calls are mocked for stability.
- **A11y Testing:** Use `axe-core` to check for serious accessibility violations.
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
| `npm run test:e2e` | E2E smoke tests |
| `npm run test:a11y` | Accessibility tests |
| `npm run test:visual` | Visual regression tests |
| `npm run test:ui` | Open Playwright interactive UI |
| `npm run test:load` | Run k6 load tests |

## 🔐 Environment Variables

Copy `.env.example` to `.env` for local development:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (prod) | Anthropic API key for Claude |
| `ANTHROPIC_MODEL` | No | Override default model (defaults to claude-sonnet-4-20250514) |
| `KONSEPTSPEILET_MOCK` | No | Set to `true` for mock responses during local dev |
| `PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `STATS_TOKEN` | No | Token for accessing `/stats` dashboard |

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
Use `useCopyWithToast` for user feedback:
```tsx
const { copy, copied } = useCopyWithToast();
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
