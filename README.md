# Fyrk Nettside

Nettside for Fyrk bygget med Astro, Tailwind CSS og design system.

## Utvikling

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

## Struktur

- `src/pages/` - Sider (index, om, kontakt, blogg)
- `src/components/` - Gjenbrukbare komponenter
- `src/layouts/` - Side-layouts
- `src/styles/` - Globale stiler og design system
- `public/` - Statiske filer (logoer, etc.)

## Design System

Nettsiden følger Fyrk design system med:
- WCAG 2.1 AA compliance
- 8-punkts grid-system
- Navy (#001F3F) og Cyan (#5AB9D3) farger
- Inter font family

## Deployment

Nettsiden er konfigurert for deployment på GitHub Pages eller Netlify.

For Netlify:
1. Connect repository til Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

## Kontaktformular

Kontaktformularen bruker Netlify Forms. For å aktivere:
1. Deploy til Netlify
2. Legg til `netlify` attributt på form-elementet (allerede gjort)
3. Netlify vil automatisk håndtere form submissions

