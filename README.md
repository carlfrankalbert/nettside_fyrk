# Fyrk Nettside

Nettside for Fyrk bygget med Astro, Tailwind CSS og design system. Nettsiden følger de 8 grunnleggende designprinsippene og er WCAG 2.1 AA compliant.

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

## 📁 Struktur

```
src/
├── components/     # Gjenbrukbare komponenter
├── layouts/        # Side-layouts
├── pages/          # Sider (index, om, kontakt, blogg)
├── styles/         # Globale stiler og design system
├── data/           # Data-filer (navigation, services, etc.)
└── content/        # Content collections (blogg)

docs/
├── deployment/     # Deployment-dokumentasjon
├── development/    # Utvikler-dokumentasjon
└── design/         # Design-dokumentasjon

tests/              # Playwright tester
```

## 🎨 Design System

Nettsiden følger Fyrk design system med:
- **Farger:** Navy (#001F3F), Cyan (#5AB9D3), Nøytrale
- **Typografi:** Inter (headings), System fonts (body)
- **Spacing:** 8px grid-system
- **WCAG 2.1 AA compliant:** Alle kontrastforhold er testet
- **Dark mode:** Full støtte med system preference detection

### Designprinsipper

Nettsiden følger de 8 grunnleggende designprinsippene:
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

```bash
# Kjør alle tester
npm test

# Kjør smoke tests
npx playwright test --project=smoke

# Kjør visual regression tests
npx playwright test --project=visual

# Kjør contrast tests
npx playwright test --project=contrast
```

Se [docs/development/TESTING.md](./docs/development/TESTING.md) for mer informasjon.

## 📚 Dokumentasjon

- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **Deployment:** [docs/deployment/](./docs/deployment/)
- **Development:** [docs/development/](./docs/development/)
- **Design:** [docs/design/](./docs/design/)
- **Designprinsipper:** [docs/design/DESIGN_PRINCIPLES.md](./docs/design/DESIGN_PRINCIPLES.md)

## 🚢 Deployment

Nettsiden er deployet på **Cloudflare Pages** med custom domain (fyrk.no).

### Cloudflare Pages
- **URL:** https://fyrk.no
- **Platform:** Cloudflare Pages med Astro SSR-støtte
- **Adapter:** `@astrojs/cloudflare`
- **Auto-deploy:** Pushes til `main` branch deployes automatisk

### Miljøvariabler (Cloudflare Pages)
Følgende miljøvariabler må settes i Cloudflare Pages Settings:
- `ANTHROPIC_API_KEY` - API-nøkkel for Claude (OKR Reviewer)

### Tidligere GitHub Pages deployment
GitHub Pages deployment er fortsatt konfigurert, men fungerer kun for statiske sider (ikke OKR Reviewer).

Se [docs/deployment/](./docs/deployment/) for detaljerte instruksjoner.

## 🛠️ Teknologi

- **Astro** - Static site generator med SSR-støtte
- **Cloudflare Pages** - Hosting og deployment
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI komponenter (OKR Reviewer)
- **Playwright** - End-to-end testing
- **TypeScript** - Type safety
- **GitHub** - Versjonskontroll og CI/CD

## 📄 Lisens

© 2025 Fyrk. Alle rettigheter reservert.
