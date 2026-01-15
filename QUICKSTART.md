# Quick Start Guide

## Første gang

1. **Installer avhengigheter:**
   ```bash
   npm install
   ```

2. **Start utviklingsserver:**
   ```bash
   npm run dev
   ```
   Nettsiden vil være tilgjengelig på `http://localhost:4321`

## Miljøvariabler

For å bruke AI-verktøyene lokalt, opprett en `.env`-fil i rot-mappen:

```bash
ANTHROPIC_API_KEY=din-api-nøkkel-her
```

> **Merk:** AI-verktøyene (OKR-sjekken, Konseptspeilet, Antakelseskart) fungerer kun med en gyldig Anthropic API-nøkkel.

## Bygging

```bash
npm run build
```

Dette genererer en `dist/` mappe med filer klar for deployment.

## Forhåndsvis produksjonsbygget

```bash
npm run preview
```

Dette starter en lokal Wrangler-server som simulerer Cloudflare Pages-miljøet.

## Deployment

### Cloudflare Pages (Anbefalt)

Nettsiden er konfigurert for Cloudflare Pages med Astro SSR-støtte:

1. Koble repository til Cloudflare Pages
2. Sett miljøvariabler:
   - `ANTHROPIC_API_KEY` - For OKR-sjekken
3. Deploy skjer automatisk ved push til `main`

**Konfigurasjon:**
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Astro

### GitHub Pages (Kun statisk)

GitHub Pages støtter kun statiske sider (OKR-sjekken vil ikke fungere):

1. Push koden til GitHub repository
2. Gå til Settings > Pages i repository
3. Velg "GitHub Actions" som source
4. Workflow vil automatisk deploye ved push til `main`

## Sider

| Side | URL | Beskrivelse |
|------|-----|-------------|
| Hjem | `/` | Landing page med hero og tjenester |
| OKR-sjekken | `/okr-sjekken` | AI-drevet OKR-evaluering |
| Konseptspeilet | `/konseptspeilet` | AI-drevet konseptrefleksjon |
| Antakelseskart | `/antakelseskart` | AI-drevet antakelseskartlegging |
| Personvern | `/personvern` | Personvernerklæring |
| Feature toggles | `/feature-toggles` | Administrasjon av feature flags |

## Testing

```bash
# Kjør alle E2E-tester
npm test

# Kjør smoke tests
npm run test:smoke

# Kjør unit tests
npm run test:unit

# Playwright UI mode
npm run test:ui
```

## Design System

Alle farger, typografi og spacing følger Fyrk design system:

| Element | Verdi |
|---------|-------|
| Navy | `#001F3F` |
| Cyan | `#5AB9D3` |
| Font (headings) | Inter |
| Font (body) | System fonts |
| Tilgjengelighet | WCAG 2.1 AA |

## Legge til blogginnlegg

Blogginnlegg lagres i `src/content/blog/`. Opprett en ny markdown-fil:

```markdown
---
title: "Min tittel"
description: "Kort beskrivelse"
pubDate: 2025-01-15
---

Innhold her...
```

## Nyttige kommandoer

```bash
npm run dev          # Utviklingsserver
npm run build        # Bygg for produksjon
npm run preview      # Forhåndsvis build
npm test             # Kjør tester
npm run test:unit    # Unit tests
npm run test:ui      # Playwright UI
```

## Videre lesing

- [README.md](./README.md) - Hovedoversikt
- [docs/development/TESTING.md](./docs/development/TESTING.md) - Testing
- [docs/deployment/](./docs/deployment/) - Deployment guides
- [docs/design/](./docs/design/) - Design dokumentasjon
