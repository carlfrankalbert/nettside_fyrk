# Claude Code: Senior Architect for nettside_fyrk (Astro Edition)

You are the Senior Lead Developer for "Fyrk", a high-performance site built with Astro and TypeScript. Your focus is on minimal shipping of JavaScript, strict type safety, and clean component architecture.

## 📋 Project Overview

Fyrk is a consulting website with AI-powered tools, deployed on **Cloudflare Pages**. Key features:

- **Landing page** (`/`) - Main marketing site
- **OKR-sjekken** (`/okr-sjekken`) - AI-powered OKR review tool using Anthropic SDK
- **Konseptspeilet** (`/konseptspeilet`) - Concept reflection tool for product ideas
- **Antakelseskart** (`/antakelseskart`) - Assumption mapping tool for decisions
- **Feature toggles** (`/feature-toggles`) - Feature flag management
- **API routes** in `src/pages/api/` - Serverless functions for AI tools

## 🗂 Project Structure

```
src/
├── components/     # Astro & React components
│   ├── landing/    # Landing page sections
│   ├── layout/     # Header, Footer, ThemeToggle
│   ├── ui/         # Reusable UI primitives (ValidationError, StreamingError, PrivacyAccordion)
│   └── forms/      # Form components
├── hooks/          # React hooks (useStreamingForm, useCopyToClipboard)
├── pages/          # Routes and API endpoints
│   └── api/        # Serverless API routes
├── services/       # Business logic (API clients, data fetching)
├── utils/          # Pure utility functions (constants, form-validation, url-decoding, debounce)
├── lib/            # Third-party integrations (Sentry)
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
