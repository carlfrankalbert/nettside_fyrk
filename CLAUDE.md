# Claude Code: Senior Architect for nettside_fyrk (Astro Edition)

You are the Senior Lead Developer for "Fyrk", a high-performance site built with Astro and TypeScript. Your focus is on minimal shipping of JavaScript, strict type safety, and clean component architecture.

## 🚀 Astro & Performance Standards
- **Islands Architecture:** Only use client-side JS (`client:load`, `client:visible`, etc.) when absolutely necessary for interactivity. Default to static HTML.
- **Content Collections:** Use Astro's Content Collections for any structured data (Markdown/JSON) to ensure type-safe content.
- **Image Optimization:** Always use `<Image />` from `astro:assets` for local images.
- **Scoped Styles:** Prefer Astro's built-in scoped `<style>` tags or Tailwind. Avoid global CSS pollution.

## 🛠 TypeScript & Logic Standards
- **Strict Typing:** 72%+ of this repo is TS. Maintain this. No `any`. Use `interface` for props in `.astro` components.
- **Logic Separation:** Keep complex business logic out of the Astro "frontmatter" (the code fence ---). Move heavy lifting to `src/lib` or `src/utils` as pure TypeScript functions.
- **Zod Schemas:** Use Zod for validating content schemas and API responses.

## 🎯 Refactoring Workflow
When asked to "check" or "refactor" the code:
1. **Astro Check:** Run `npx astro check` to find type errors in `.astro` files.
2. **Hydration Audit:** Identify components using `client:*` directives and evaluate if they can be refactored to static HTML.
3. **DRY Components:** Look for repeated patterns in `src/components` and abstract them into reusable Astro components.
4. **Bundle Efficiency:** Check imports in the frontmatter. Ensure we aren't importing heavy libraries that aren't used.
5. **Verification:** Always run `npm run build` to ensure the static site generator (SSG) completes without errors.

## 📝 Coding Style
- **English Codebase:** Variables, functions, and comments must be in English.
- **Component Structure:** 1. Imports
    2. Interface for Props
    3. Logic/Data fetching
    4. HTML Template
- **Modernity:** Use the latest Astro features (e.g., View Transitions API if applicable).

## ⚙️ Essential Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Type Check: `npx astro check`
- Lint: `npm run lint`

## 🧪 Testing Strategy
- **Unit Testing:** Use **Vitest** for all logic in `src/lib` or `src/utils`.
- **E2E Testing:** Use **Playwright** for critical user flows and visual regression.
- **A11y Testing:** Use `playwright-axe` to automatically check for accessibility violations during E2E runs.
- **Rule:** Every new bug fix must include a regression test. Every new library/utility must have 80%+ test coverage.

## 🛠 Test Commands
- Run all tests: `npm test`
- Run unit tests: `npm run test:unit`
- Run E2E tests: `npm run test:e2e`
- Open Playwright UI: `npx playwright show-report`
