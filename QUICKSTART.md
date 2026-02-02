# Quick Start Guide

## Oppsett

1. **Kopier miljøvariabler:**
   ```bash
   cp .env.example .env
   ```
   Legg til `ANTHROPIC_API_KEY` for å bruke AI-verktøyene. Sett `KONSEPTSPEILET_MOCK=true` for å teste UX uten API-nøkkel.

2. **Installer og start:**
   ```bash
   npm install
   npm run dev
   ```
   Nettsiden er tilgjengelig på `http://localhost:4321`

## Bygging

```bash
npm run build     # Bygg for produksjon (dist/)
npm run preview   # Forhåndsvis med lokal Wrangler-server (simulerer Cloudflare Pages)
```

## Sider

| Side | URL | Beskrivelse |
|------|-----|-------------|
| Hjem | `/` | Landing page |
| OKR-sjekken | `/okr-sjekken` | AI-drevet OKR-evaluering |
| Konseptspeilet | `/konseptspeilet` | AI-drevet konseptrefleksjon |
| Antakelseskart | `/antakelseskart` | AI-drevet antakelseskartlegging |
| Pre-Mortem Brief | `/verktoy/pre-mortem` | AI-drevet feilmodusanalyse |
| Beslutningslogg | `/beslutningslogg` | Manuell beslutningsdokumentering (ingen AI) |
| Verktøyoversikt | `/verktoy` | Oversikt over alle verktøy |
| Tjenester | `/tjenester` | Tjenesteoversikt |
| Om FYRK | `/about` | Om selskapet |
| Personvern | `/personvern` | Personvernerklæring |
| Vilkår | `/vilkar` | Brukervilkår |
| Feature toggles | `/feature-toggles` | Feature flag-administrasjon |
| Stats | `/stats?token=X` | Intern analytics (krever STATS_TOKEN) |

## Testing

```bash
npm run test           # Full kvalitetssuite (typecheck + lint + unit + e2e)
npm run test:unit      # Unit-tester (Vitest)
npm run test:e2e       # Smoke-tester (Playwright)
npm run test:a11y      # Tilgjengelighetstester
npm run test:visual    # Visuell regresjon
npm run test:mobile    # Mobil UX-tester
npm run test:ui        # Playwright interaktiv UI
npm run test:load      # k6 load-tester
```

## Deployment

### Cloudflare Pages (produksjon)

Deploy skjer automatisk ved push til `main`. Miljøvariabler settes i Cloudflare Pages dashboard:

| Variabel | Påkrevd | Beskrivelse |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Ja | API-nøkkel for Claude |
| `STATS_TOKEN` | Nei | Token for /stats-dashboardet |
| `PUBLIC_SENTRY_DSN` | Nei | Sentry error tracking |

Se [docs/deployment/](./docs/deployment/) for detaljerte guider.

## Videre lesing

- [README.md](./README.md) — Hovedoversikt
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Bidragsregler og doc-krav
- [CLAUDE.md](./CLAUDE.md) — Arkitektur og kodestandarder
- [docs/README.md](./docs/README.md) — Dokumentasjonsindeks
