# Fyrk Nettside

Nettside for Fyrk bygget med Astro, Tailwind CSS og React. Nettsiden følger de 8 grunnleggende designprinsippene og er WCAG 2.1 AA compliant.

**Live:** https://fyrk.no

## 🚀 Komme i gang

Se [QUICKSTART.md](./QUICKSTART.md) for rask start-guide.

```bash
# Installer avhengigheter
npm install

# Start utviklingsserver
npm run dev

# Bygg for produksjon
npm run build

# Forhåndsvis produksjonsbygget
npm run preview
```

## ✨ Hovedfunksjoner

### OKR-sjekken (AI-drevet OKR Reviewer)
Et interaktivt verktøy for å evaluere kvaliteten på OKR-er (Objectives and Key Results):
- **AI-analyse:** Bruker Claude API for kvalitetsvurdering
- **Scoring:** 1-10 skala med detaljert tilbakemelding
- **Streaming:** Sanntids-respons under evaluering
- **Personvern:** Ingen data lagres permanent
- **Sikkerhet:** Prompt injection-beskyttelse med XML-tagging

Tilgjengelig på `/okr-sjekken`

### Nettsiden
- **Responsivt design** - Mobile-first tilnærming
- **Dark mode** - Automatisk system preference detection
- **WCAG 2.1 AA** - Tilgjengelig for alle brukere
- **Rask lasting** - Statisk generering med Astro

## 📁 Prosjektstruktur

```
nettside_fyrk/
├── src/
│   ├── components/          # Gjenbrukbare komponenter
│   │   ├── landing/        # Landing page seksjoner
│   │   ├── layout/         # Header, Footer, ThemeToggle
│   │   ├── forms/          # Skjema-komponenter
│   │   ├── ui/             # Basis UI-elementer
│   │   ├── seo/            # SEO-komponenter
│   │   └── OKRReviewer.tsx # OKR-sjekken verktøy (React)
│   ├── pages/              # Astro sider
│   │   ├── index.astro     # Hjemmeside
│   │   ├── okr-sjekken.astro
│   │   ├── 404.astro
│   │   ├── 500.astro
│   │   └── api/
│   │       └── okr-sjekken.ts  # OKR API endpoint
│   ├── layouts/            # Side-layouts
│   ├── content/            # Content collections (blogg)
│   ├── styles/             # Globale stiler
│   ├── utils/              # Hjelpefunksjoner
│   ├── services/           # Business logic
│   ├── scripts/            # Client-side scripts
│   ├── types/              # TypeScript types
│   ├── config/             # App-konfigurasjon
│   └── data/               # Statiske data
├── tests/                  # Playwright E2E tester
├── docs/                   # Dokumentasjon
│   ├── deployment/         # Deployment-guides
│   ├── development/        # Utvikler-dokumentasjon
│   └── design/             # Design-dokumentasjon
└── public/                 # Statiske assets
```

## 🎨 Design System

Nettsiden følger Fyrk design system med:

| Element | Verdi |
|---------|-------|
| **Primærfarge (Navy)** | `#001F3F` |
| **Sekundærfarge (Cyan)** | `#5AB9D3` |
| **Typografi** | Inter (headings), System fonts (body) |
| **Spacing** | 8px grid-system |
| **Tilgjengelighet** | WCAG 2.1 AA compliant |
| **Dark mode** | System preference detection |

### Designprinsipper

1. ✅ **Alignment** - Konsistent justering med container-basert layout
2. ✅ **Hierarchy** - Klar typografisk hierarki (Display → H1 → H2 → Body)
3. ✅ **Contrast** - Høy kontrast (WCAG 2.1 AA compliant)
4. ✅ **Repetition** - Konsistent bruk av farger, fonter, former
5. ✅ **Proximity** - Logisk gruppering av relaterte elementer
6. ✅ **Balance** - Asymmetrisk balanse i layout
7. ✅ **Color** - Strategisk bruk av brand-farger
8. ✅ **Negative Space** - Generøs whitespace for lesbarhet

Se [docs/design/DESIGN_PRINCIPLES.md](./docs/design/DESIGN_PRINCIPLES.md) for detaljert evaluering.

## 🧪 Testing

Prosjektet har omfattende testing med både E2E-tester (Playwright) og unit-tester (Vitest).

### Kjør tester

```bash
# Alle E2E-tester
npm test

# Smoke tests (desktop, mobile, tablet)
npm run test:smoke

# Visual regression tests
npm run test:visual

# Mobile-spesifikke tester
npm run test:mobile

# OKR API tests
npm run test:okr-api

# Theme toggle tests
npm run test:theme

# Unit tests
npm run test:unit

# Unit tests med coverage
npm run test:unit:coverage

# Playwright UI mode
npm run test:ui
```

### Test-prosjekter

| Prosjekt | Beskrivelse |
|----------|-------------|
| `smoke` | Daglige kritiske brukerflyt-tester |
| `visual` | Visuell regresjonstesting |
| `visual-mobile` | Mobil visuell testing |
| `ux-mobile` | Mobil UX-testing |
| `okr-api` | OKR API endpoint-testing |
| `theme` | Dark/light mode testing |
| `contrast` | WCAG kontrast-tester |

Se [docs/development/TESTING.md](./docs/development/TESTING.md) for mer informasjon.

## 🚢 Deployment

Nettsiden er deployet på **Cloudflare Pages** med custom domain.

### Cloudflare Pages

| Innstilling | Verdi |
|-------------|-------|
| **URL** | https://fyrk.no |
| **Platform** | Cloudflare Pages |
| **Adapter** | `@astrojs/cloudflare` |
| **Build command** | `npm run build` |
| **Output directory** | `dist/` |
| **Auto-deploy** | Push til `main` |

### Miljøvariabler

Følgende miljøvariabler må settes i Cloudflare Pages:

| Variabel | Beskrivelse | Påkrevd |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | API-nøkkel for Claude (OKR-sjekken) | Ja |
| `PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | Nei |
| `PUBLIC_SENTRY_ENVIRONMENT` | Miljønavn (production/staging) | Nei |
| `PUBLIC_SENTRY_RELEASE` | Release-versjon for tracking | Nei |
| `STATS_TOKEN` | Token for å beskytte /stats og /api/vitals | Nei |

Se [docs/deployment/](./docs/deployment/) for detaljerte instruksjoner.

## 🛠️ Teknologi

### Core Stack
- **[Astro](https://astro.build)** v4.0+ - Static site generator med hybrid rendering
- **[Cloudflare Pages](https://pages.cloudflare.com)** - Hosting og deployment
- **[Tailwind CSS](https://tailwindcss.com)** v3.4 - Utility-first CSS
- **[React](https://react.dev)** v18.2 - Interaktive komponenter
- **[TypeScript](https://www.typescriptlang.org)** v5.0 - Type safety

### Testing
- **[Playwright](https://playwright.dev)** v1.57 - E2E og visual testing
- **[Vitest](https://vitest.dev)** v4.0 - Unit testing
- **[happy-dom](https://github.com/nicubarbaros/happy-dom)** - DOM-simulering for tester
- **[k6](https://k6.io)** - Load testing

### Integrasjoner
- **[Anthropic Claude API](https://anthropic.com)** - AI for OKR-evaluering

### Monitoring
- **[Sentry](https://sentry.io)** - Error tracking og performance monitoring
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** - Automatisert performance testing
- **Web Vitals RUM** - Real User Monitoring for Core Web Vitals

## 📜 NPM Scripts

```bash
# Utvikling
npm run dev              # Start utviklingsserver (port 4321)
npm run start            # Alias for dev
npm run preview          # Forhåndsvis produksjonsbygget

# Bygging
npm run build            # Bygg for produksjon

# Testing
npm test                 # Alle Playwright-tester
npm run test:smoke       # Smoke tests
npm run test:visual      # Visual regression
npm run test:mobile      # Mobile tester
npm run test:okr-api     # OKR API tests
npm run test:theme       # Theme toggle tests
npm run test:unit        # Unit tests (Vitest)
npm run test:unit:watch  # Unit tests i watch-mode
npm run test:unit:coverage # Unit tests med coverage
npm run test:ui          # Playwright UI mode

# Load testing (krever k6)
npm run test:load            # Smoke test
npm run test:load:sustained  # Vedvarende last (10 brukere)
npm run test:load:stress     # Stresstest
npm run test:load:spike      # Spike-test
```

## 📚 Dokumentasjon

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Deployment:** [docs/deployment/](./docs/deployment/)
- **Development:** [docs/development/](./docs/development/)
- **Design:** [docs/design/](./docs/design/)
- **Testing:** [docs/development/TESTING.md](./docs/development/TESTING.md)
- **Monitoring:** [docs/development/MONITORING.md](./docs/development/MONITORING.md)
- **Load Testing:** [load-tests/README.md](./load-tests/README.md)

## 🔒 Sikkerhet

- **Prompt injection-beskyttelse** - XML-tagging av brukerinput
- **Rate limiting** - Per-IP begrensning på API
- **Input-validering** - Server-side validering
- **XSS-beskyttelse** - Escaped output
- **Ingen permanent datalagring** - Personvern-fokusert

## 📄 Lisens

© 2025 Fyrk. Alle rettigheter reservert.
