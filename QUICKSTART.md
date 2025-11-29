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

## Bygging

```bash
npm run build
```

Dette genererer en `dist/` mappe med statiske filer klar for deployment.

## Deployment

### GitHub Pages

1. Push koden til GitHub repository
2. Gå til Settings > Pages i repository
3. Velg "GitHub Actions" som source
4. Workflow vil automatisk deploye når du pusher til `main` branch

### Netlify

1. Connect repository til Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Netlify vil automatisk håndtere kontaktformularen

## Struktur

- **Hjem** (`/`) - Hero section og tjenester
- **Om oss** (`/om`) - Informasjon om Fyrk
- **Kontakt** (`/kontakt`) - Kontaktformular
- **Blogg** (`/blogg`) - Bloggliste og individuelle innlegg

## Design System

Alle farger, typografi og spacing følger Fyrk design system:
- Navy: `#001F3F`
- Cyan: `#5AB9D3`
- Font: Inter (headings), System fonts (body)
- WCAG 2.1 AA compliant

## Legge til blogginnlegg

For å legge til nye blogginnlegg, rediger `src/pages/blogg/index.astro` og legg til nye posts i arrayet. For produksjon, vurder å bruke en CMS eller markdown-filer.

