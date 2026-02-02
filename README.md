# Fyrk Nettside

Nettside for Fyrk bygget med Astro, Tailwind CSS og React. Deployet på Cloudflare Pages.

**Live:** https://fyrk.no

## Komme i gang

Se [QUICKSTART.md](./QUICKSTART.md) for rask start-guide.

```bash
cp .env.example .env   # Legg til ANTHROPIC_API_KEY
npm install
npm run dev            # localhost:4321
```

## Verktøy

Fyrk tilbyr fem verktøy for produktteam — fire AI-drevne og ett manuelt:

### AI-drevne verktøy

| Verktøy | URL | Beskrivelse |
|---------|-----|-------------|
| **OKR-sjekken** | `/okr-sjekken` | Evaluerer kvaliteten på OKR-er med scoring og forbedringsforslag |
| **Konseptspeilet** | `/konseptspeilet` | Refleksjonsverktøy som analyserer produktkonsepter langs fire risikodimensjoner |
| **Antakelseskart** | `/antakelseskart` | Kartlegger implisitte antakelser i beslutninger, kategorisert etter type og risiko |
| **Pre-Mortem Brief** | `/verktoy/pre-mortem` | Genererer feilmodusanalyse for planlagte beslutninger |

Alle AI-verktøy bruker Claude API med streaming-respons, krever ingen innlogging, og lagrer ikke innhold.

### Manuelt verktøy

| Verktøy | URL | Beskrivelse |
|---------|-----|-------------|
| **Beslutningslogg** | `/beslutningslogg` | Dokumenterer beslutninger med kritiske antakelser og eksporterer til Markdown |

### Tjenestesider

| Side | URL |
|------|-----|
| Tjenester (oversikt) | `/tjenester` |
| Beslutningsgjennomgang | `/tjenester/beslutningsgjennomgang` |
| Interim produktleder | `/tjenester/interim-produktleder` |
| Kvalitet og leveranseledelse | `/tjenester/kvalitet-og-leveranseledelse` |

### Andre sider

| Side | URL | Beskrivelse |
|------|-----|-------------|
| Hjem | `/` | Landing page |
| Verktøyoversikt | `/verktoy` | Oversikt over alle verktøy |
| Om FYRK | `/about` | Om selskapet |
| Personvern | `/personvern` | Personvernerklæring |
| Vilkår | `/vilkar` | Brukervilkår |
| Beta | `/beta` | Beta-funksjoner (feature-flagget) |
| Feature toggles | `/feature-toggles` | Administrasjon av feature flags |
| Stats | `/stats` | Intern analytics (token-beskyttet) |
| Releaselog | `/releaselog` | Automatisk genererte release notes |

## Prosjektstruktur

```
src/
├── components/
│   ├── OKRReviewer.tsx         # OKR-sjekken
│   ├── KonseptSpeil.tsx        # Konseptspeilet
│   ├── Antakelseskart.tsx      # Antakelseskart
│   ├── PreMortemBrief.tsx      # Pre-Mortem Brief
│   ├── Beslutningslogg.tsx     # Beslutningslogg
│   ├── konseptspeil/           # Sub-komponenter for Konseptspeilet
│   ├── antakelseskart/         # Sub-komponenter for Antakelseskart
│   ├── content/                # Delte innholdskomponenter (ToolBenefits, ToolWhenToUse, etc.)
│   ├── dashboard/              # Analytics dashboard
│   ├── form/                   # React skjema-primitiver
│   ├── forms/                  # Astro skjema-komponenter
│   ├── landing/                # Landing page seksjoner
│   ├── layout/                 # Header, Footer
│   ├── seo/                    # SEO-komponenter
│   └── ui/                     # UI-primitiver (PrivacyAccordion, StreamingError, etc.)
├── hooks/
│   ├── useStreamingForm.ts     # Delt streaming-logikk for AI-verktøy
│   ├── useCopyToClipboard.ts   # Kopier med inline feedback
│   ├── useCopyWithToast.ts     # Kopier med toast-notifikasjon
│   ├── useFormInputHandlers.ts # Textarea auto-resize
│   ├── usePreMortemForm.ts     # Pre-Mortem skjemalogikk
│   └── usePreMortemStreaming.ts # Pre-Mortem streaming
├── pages/
│   ├── api/                    # Serverless API-endepunkter
│   │   ├── okr-sjekken.ts
│   │   ├── konseptspeilet.ts
│   │   ├── antakelseskart.ts
│   │   ├── pre-mortem.ts
│   │   ├── feature-toggles.ts
│   │   ├── track.ts            # Anonym klikk-tracking
│   │   ├── pageview.ts         # Sidevisninger
│   │   ├── vitals.ts           # Web Vitals
│   │   └── health.ts           # Helsesjekk
│   ├── tjenester/              # Tjenestesider
│   └── verktoy/                # Verktøy-undersider
├── services/                   # Business logic og API-klienter
├── utils/                      # Pure utility-funksjoner
├── lib/                        # Tredjepartsintegrasjoner (Sentry, streaming-client)
├── data/                       # Statisk data
├── layouts/                    # Side-layouts (BaseLayout, MinimalLayout)
├── styles/                     # Globale stiler
├── scripts/                    # Klient-side scripts (tracking, mobile-menu)
├── config/                     # App-konfigurasjon
└── types/                      # TypeScript-typer
```

## Testing

```bash
npm run test              # Full kvalitetssuite (typecheck + lint + unit + e2e)
npm run test:unit         # Vitest unit-tester
npm run test:e2e          # Playwright smoke-tester
npm run test:a11y         # Tilgjengelighetstester (axe-core)
npm run test:visual       # Visuell regresjon
npm run test:mobile       # Mobil-spesifikke tester
npm run test:load         # k6 load-tester
npm run test:unit:coverage # Unit-tester med coverage-rapport
```

| Nivå | Verktøy | Beskytter |
|------|---------|-----------|
| Statisk analyse | TypeScript (`astro check`), ESLint | Typefeil, kodestil |
| Unit/Integration | Vitest (374 tester, ~40% coverage) | Forretningslogikk, parsere, validering |
| E2E | Playwright | Kritiske brukerflyter, smoke, a11y |
| Visuell regresjon | Playwright snapshots | UI-endringer |
| Load testing | k6 | API-ytelse under last |

## CI/CD

11 GitHub workflows:

| Workflow | Trigger | Formål |
|----------|---------|--------|
| `ci.yml` | Push/PR | Typecheck, lint, unit, e2e |
| `lighthouse-ci.yml` | Push til main | Performance-budsjett |
| `release-notes.yml` | Push til main | Auto-genererte release notes |
| `docs-gate.yml` | PR | Sjekker at docs er oppdatert |
| `nightly.yml` | Cron | Full test-suite nattlig |
| `visual-regression.yml` | PR | Visuell diff |
| `deploy.yml` | Push til main | Produksjons-deploy |
| `deploy-preview.yml` | PR | Preview-deploy |
| `deploy-test.yml` | PR | Test-deploy |
| `smoke-test.yml` | Etter deploy | Post-deploy verifisering |
| `contrast-test.yml` | PR | Fargekontrast-sjekk |

## Deployment

Deployet på **Cloudflare Pages** med auto-deploy fra `main`.

| Innstilling | Verdi |
|-------------|-------|
| URL | https://fyrk.no |
| Platform | Cloudflare Pages |
| Adapter | `@astrojs/cloudflare` |
| Build command | `npm run build` |
| Output | `dist/` |

### Miljøvariabler

| Variabel | Påkrevd | Beskrivelse |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Ja (prod) | API-nøkkel for Claude |
| `ANTHROPIC_MODEL` | Nei | Override modell (default: claude-sonnet-4-20250514) |
| `KONSEPTSPEILET_MOCK` | Nei | `true` for mock-respons lokalt |
| `PUBLIC_SENTRY_DSN` | Nei | Sentry DSN |
| `STATS_TOKEN` | Nei | Token for /stats og /api/vitals |

Se `.env.example` for komplett oversikt.

## Teknologi

- **[Astro](https://astro.build)** — Static site generator med hybrid SSR
- **[Cloudflare Pages](https://pages.cloudflare.com)** — Hosting med KV storage
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first CSS
- **[React](https://react.dev)** — Interaktive verktøy-komponenter
- **[TypeScript](https://www.typescriptlang.org)** — Type safety
- **[Anthropic Claude API](https://anthropic.com)** — AI for alle verktøy
- **[Playwright](https://playwright.dev)** — E2E, a11y, visuell testing
- **[Vitest](https://vitest.dev)** — Unit testing
- **[Sentry](https://sentry.io)** — Error tracking
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** — Performance testing
- **[k6](https://k6.io)** — Load testing

## Sikkerhet

- Prompt injection-beskyttelse med XML-tagging
- Rate limiting per IP
- Input-validering og output-validering (server-side)
- Request signing
- Bot-deteksjon og tracking-ekskludering
- Ingen permanent datalagring av brukerinnhold

## Dokumentasjon

| Dokument | Innhold |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | Rask oppstart |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Bidragsregler og doc-krav |
| [CLAUDE.md](./CLAUDE.md) | Arkitektur, kodestandarder, kontrakter |
| [docs/README.md](./docs/README.md) | Dokumentasjonsindeks |
| [docs/features/](./docs/features/) | Feature-dokumentasjon |
| [docs/routines/](./docs/routines/) | Operasjonelle rutiner |
| [docs/deployment/](./docs/deployment/) | Deploy-guider |
| [docs/development/](./docs/development/) | Utvikler-dokumentasjon |
| [docs/design/](./docs/design/) | Design-prinsipper |
| [docs/security/](./docs/security/) | Sikkerhetstesting |

## Lisens

Proprietær programvare.
