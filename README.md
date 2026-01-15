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

## ✨ AI-verktøy

Fyrk tilbyr tre AI-drevne verktøy for produktteam:

### OKR-sjekken (`/okr-sjekken`)
Evaluerer kvaliteten på OKR-er (Objectives and Key Results):
- **AI-analyse:** Bruker Claude API for kvalitetsvurdering
- **Scoring:** 1-10 skala med detaljert tilbakemelding
- **Streaming:** Sanntids-respons under evaluering

### Konseptspeilet (`/konseptspeilet`)
Refleksjonsverktøy for produktkonsepter:
- **Strukturert analyse:** Basert på de fire produktrisikoene (verdi, brukbarhet, gjennomførbarhet, levedyktighet)
- **Antakelsesavdekking:** Identifiserer implisitte forutsetninger
- **Streaming:** Sanntids-respons med progressiv visning

### Antakelseskart (`/antakelseskart`)
Kartlegger implisitte antakelser i beslutninger:
- **Kategorisering:** Sorterer antakelser etter type (målgruppe, behov, løsning, forretningsmodell)
- **Risikovurdering:** Markerer kritiske antakelser
- **Eksport:** Kopier til utklippstavle for videre bruk

### Felles egenskaper
- **Personvern:** Ingen data lagres permanent
- **Sikkerhet:** Prompt injection-beskyttelse med XML-tagging
- **Tilgjengelighet:** WCAG 2.1 AA compliant

## 🌐 Nettsiden

- **Responsivt design** - Mobile-first tilnærming
- **Dark mode** - Automatisk system preference detection
- **WCAG 2.1 AA** - Tilgjengelig for alle brukere
- **Rask lasting** - Statisk generering med Astro

## 📁 Prosjektstruktur

```
nettside_fyrk/
├── src/
│   ├── components/           # Gjenbrukbare komponenter
│   │   ├── landing/          # Landing page seksjoner
│   │   ├── layout/           # Header, Footer, ThemeToggle
│   │   ├── forms/            # Skjema-komponenter
│   │   ├── ui/               # Basis UI-elementer
│   │   │   ├── ValidationError.tsx   # Inline feilmelding
│   │   │   ├── StreamingError.tsx    # Feil i resultatområde
│   │   │   └── PrivacyAccordion.tsx  # Personvern-accordion
│   │   ├── seo/              # SEO-komponenter
│   │   ├── OKRReviewer.tsx   # OKR-sjekken (React)
│   │   ├── KonseptSpeil.tsx  # Konseptspeilet (React)
│   │   └── Antakelseskart.tsx # Antakelseskart (React)
│   ├── pages/                # Astro sider
│   │   ├── index.astro       # Hjemmeside
│   │   ├── okr-sjekken.astro
│   │   ├── konseptspeilet.astro
│   │   ├── antakelseskart.astro
│   │   ├── feature-toggles.astro
│   │   ├── personvern.astro
│   │   ├── 404.astro
│   │   ├── 500.astro
│   │   └── api/
│   │       ├── okr-sjekken.ts
│   │       ├── konseptspeilet.ts
│   │       ├── antakelseskart.ts
│   │       └── feature-toggles.ts
│   ├── hooks/                # React hooks
│   │   ├── useStreamingForm.ts    # Delt streaming-logikk
│   │   └── useCopyToClipboard.ts  # Kopier til utklippstavle
│   ├── services/             # Business logic
│   │   ├── okr-service.ts
│   │   ├── konseptspeil-service.ts
│   │   └── antakelseskart-service.ts
│   ├── utils/                # Hjelpefunksjoner
│   │   ├── constants.ts      # Delte konstanter
│   │   ├── form-validation.ts
│   │   ├── url-decoding.ts
│   │   └── debounce.ts
│   ├── layouts/              # Side-layouts
│   ├── styles/               # Globale stiler
│   ├── types/                # TypeScript types
│   ├── config/               # App-konfigurasjon
│   └── data/                 # Statiske data
├── tests/                    # Playwright E2E tester
├── docs/                     # Dokumentasjon
│   ├── deployment/           # Deployment-guides
│   ├── development/          # Utvikler-dokumentasjon
│   └── design/               # Design-dokumentasjon
└── public/                   # Statiske assets
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

Prosjektet har et pragmatisk testregime designet for trygghet og ro i deploy-beslutninger.

```bash
# Golden command – kjører hele kvalitetssuiten
npm run test
```

Når `npm run test` er grønt, kan vi deploye med ro.

### Kvalitetsnivåer

| Nivå | Verktøy | Beskytter |
|------|---------|-----------|
| Statisk analyse | TypeScript, ESLint | Typefeil, kodestil |
| Unit/Integration | Vitest | Forretningslogikk |
| E2E | Playwright | Kritiske brukerflyter |
| Tilgjengelighet | axe-core | WCAG-brudd |

### Vanlige kommandoer

```bash
npm run test:unit     # Unit-tester
npm run test:e2e      # E2E smoke-tester
npm run test:a11y     # Tilgjengelighetstester
npm run test:visual   # Visuell regresjon (manuelt)
```

Se [TESTING.md](./TESTING.md) for komplett dokumentasjon.

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
| `ANTHROPIC_API_KEY` | API-nøkkel for Claude (AI-verktøy) | Ja |
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
- **[Anthropic Claude API](https://anthropic.com)** - AI for alle verktøy

### Monitoring
- **[Sentry](https://sentry.io)** - Error tracking og performance monitoring
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** - Automatisert performance testing
- **Web Vitals RUM** - Real User Monitoring for Core Web Vitals

## 📜 NPM Scripts

```bash
# Utvikling
npm run dev              # Start utviklingsserver (port 4321)
npm run preview          # Forhåndsvis produksjonsbygget

# Bygging
npm run build            # Bygg for produksjon

# Kvalitetssikring
npm run test             # Full kvalitetssuite (typecheck + lint + unit + e2e)
npm run typecheck        # TypeScript-sjekk
npm run lint             # ESLint
npm run test:unit        # Unit-tester (Vitest)
npm run test:e2e         # E2E smoke-tester (Playwright)
npm run test:a11y        # Tilgjengelighetstester
```

## 📚 Dokumentasjon

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Testing:** [TESTING.md](./TESTING.md)
- **Deployment:** [docs/deployment/](./docs/deployment/)
- **Development:** [docs/development/](./docs/development/)
- **Design:** [docs/design/](./docs/design/)
- **Monitoring:** [docs/development/MONITORING.md](./docs/development/MONITORING.md)
- **Load Testing:** [load-tests/README.md](./load-tests/README.md)

## 🔒 Sikkerhet

- **Prompt injection-beskyttelse** - XML-tagging av brukerinput
- **Rate limiting** - Per-IP begrensning på API
- **Input-validering** - Server-side validering
- **XSS-beskyttelse** - Escaped output
- **Ingen permanent datalagring** - Personvern-fokusert

## 📄 Lisens

Dette prosjektet er proprietær programvare uten åpen kildekode-lisens.
