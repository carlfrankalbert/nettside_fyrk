# Testing Documentation

## Oversikt

Prosjektet bruker to test-rammeverk:

1. **Playwright** - E2E-tester, visual regression, og integrasjonstester
2. **Vitest** - Unit-tester for funksjoner og utilities

## Visual Testing Philosophy

Vår testing-tilnærming følger en klar separasjon:

- **Funksjonelle tester verifiserer *tilstedeværelse*** (element eksisterer)
  - Smoke tests sjekker at kritiske elementer er til stede og funksjonelle
  - De verifiserer at siden laster, navigasjon fungerer, og nøkkelinnhold er synlig
  - Eksempel: "Kontaktskjemaet er synlig og tilgjengelig"

- **Visual regression tests verifiserer *utseende*** (element ser riktig ut)
  - Visuelle tester tar screenshots og sammenligner mot godkjente baselines
  - De oppdager visuelle endringer, enten tilsiktede eller utilsiktede
  - Eksempel: "Hjemmesiden hero-seksjon matcher godkjent design"

- **Baseline screenshots representerer godkjent design**
  - Baseline screenshots i `tests/__snapshots__/` er sannhetskilden
  - Disse representerer design som er gjennomgått og godkjent
  - Ethvert avvik fra baseline indikerer et potensielt problem eller tilsiktet endring

## Kjør Tester Lokalt

### Forutsetninger

```bash
npm install
npm run build
npx playwright install  # Installer nettlesere første gang
```

### Alle Tester

```bash
# Alle E2E-tester (Playwright)
npm test

# Alle unit-tester (Vitest)
npm run test:unit
```

## E2E Testing (Playwright)

### Test-prosjekter

| Prosjekt | Kommando | Beskrivelse |
|----------|----------|-------------|
| Smoke | `npm run test:smoke` | Kritiske brukerflyter (desktop, mobile, tablet) |
| Visual | `npm run test:visual` | Visual regression (desktop) |
| Visual Mobile | `npm run test:visual-mobile` | Mobil visual regression |
| UX Mobile | `npm run test:ux-mobile` | Mobil brukeropplevelse |
| Mobile (alle) | `npm run test:mobile` | Visual + UX mobile kombinert |
| Security | `npm run test:security` | OWASP sikkerhetstester |
| OKR API | `npm run test:okr-api` | OKR-sjekken API-tester |
| Theme | `npm run test:theme` | Dark/light mode testing |

### Smoke Tests

Daglige tester for kritiske brukerflyter:

```bash
npm run test:smoke
```

Kjører på:
- Desktop Chrome
- iPhone 14
- iPad Pro

### Visual Regression Tests

Månedlige tester for visuell konsistens:

```bash
npm run test:visual
```

Kjører på:
- Desktop Chrome, Firefox, Safari
- iPhone 14, Pixel 7
- iPad Pro

### Security Tests

OWASP-baserte sikkerhetstester:

```bash
npm run test:security
```

Tester inkluderer:
- XSS-beskyttelse
- Input-validering
- Headers-sikkerhet

### OKR API Tests

Tester for OKR-sjekken API-endepunktet:

```bash
npm run test:okr-api
```

Tester inkluderer:
- Input-validering
- Rate limiting
- Prompt injection-beskyttelse
- Respons-format

### Theme Toggle Tests

Tester for dark/light mode:

```bash
npm run test:theme
```

Tester inkluderer:
- System preference detection
- Toggle-funksjonalitet
- Persistens i localStorage

### Playwright UI Mode

For interaktiv debugging:

```bash
npm run test:ui
```

## Unit Testing (Vitest)

Unit-tester bruker Vitest med happy-dom for DOM-simulering.

### Kjør Unit Tests

```bash
# Kjør én gang
npm run test:unit

# Watch mode (re-kjører ved endringer)
npm run test:unit:watch

# Med coverage rapport
npm run test:unit:coverage
```

### Testfiler

Unit-tester ligger i `src/` ved siden av kildekoden:

```
src/
├── utils/
│   ├── form-validation.ts
│   ├── form-validation.test.ts
│   ├── okr-parser.ts
│   ├── okr-parser.test.ts
│   ├── cache.ts
│   └── cache.test.ts
├── services/
│   ├── okr-service.ts
│   └── okr-service.test.ts
```

### Eksempel Unit Test

```typescript
// src/utils/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './example';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

## Test Struktur

```
tests/
├── pages.smoke.ts          # Alle sider smoke tests
├── pages.visual.ts         # Desktop visual regression
├── mobile.visual.ts        # Mobile visual regression
├── mobile.ux.ts            # Mobile UX tests
├── contrast.spec.ts        # WCAG kontrast-tester
├── security.spec.ts        # Sikkerhetstester
├── okr-sjekken.spec.ts     # OKR API tests
├── theme-toggle.spec.ts    # Theme toggle tests
└── *-snapshots/            # Visual regression baselines
```

## GitHub Actions Workflows

### Daily Smoke Test

- **Schedule:** Hver dag kl 06:00 UTC
- **Manuell trigger:** Tilgjengelig via workflow_dispatch
- **Tester:** Kritiske brukerflyter på desktop, mobile, tablet
- **Lokasjon:** `.github/workflows/smoke-test.yml`

### Monthly Visual Regression

- **Schedule:** Første dag i måneden kl 08:00 UTC
- **Manuell trigger:** Tilgjengelig via workflow_dispatch
- **Tester:** Visual snapshots på topp device/browser-konfigurasjoner
- **Lokasjon:** `.github/workflows/visual-regression.yml`

## Oppdater Visual Baselines

Når du gjør tilsiktede visuelle endringer:

1. **Gjør designendringene** i kodebasen
2. **Kjør visual tests lokalt**: `npm run test:visual`
3. **Gjennomgå forskjellene** i testresultatene:
   - Sjekk diff-bildene i `test-results/`
   - Verifiser at endringene matcher tilsiktet design
4. **Oppdater baselines**: `npx playwright test --update-snapshots`
5. **Commit de oppdaterte snapshotsene** sammen med kodeendringene

**Viktig**: Oppdater aldri baselines uten å gjennomgå de visuelle forskjellene først.

## Legge til Nye Tester

### Ny Smoke Test

```typescript
// tests/new-feature.smoke.ts
import { test, expect } from '@playwright/test';

test('new feature works', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Ny Visual Test

```typescript
// tests/new-feature.visual.ts
import { test, expect } from '@playwright/test';

test('new feature visual snapshot', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page).toHaveScreenshot('new-feature.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
```

### Ny Unit Test

```typescript
// src/utils/new-utility.test.ts
import { describe, it, expect } from 'vitest';
import { newUtility } from './new-utility';

describe('newUtility', () => {
  it('handles valid input', () => {
    expect(newUtility('valid')).toBe(true);
  });

  it('handles invalid input', () => {
    expect(newUtility('')).toBe(false);
  });
});
```

## Konfigurasjon

### Playwright Config

Tester er konfigurert i `playwright.config.ts` med separate prosjekter for ulike testtyper og devices.

### Vitest Config

Unit-tester er konfigurert i `vitest.config.ts` (eller `vite.config.ts`) med happy-dom for DOM-simulering.

## Feilsøking

### Tester feiler lokalt

1. Sørg for at siden er bygget: `npm run build`
2. Sjekk at Playwright-nettlesere er installert: `npx playwright install`
3. Verifiser at preview-serveren starter: `npm run preview`

### Visual tests viser false positives

- **Gjennomgå diff-bildene** i `test-results/`
- **Avgjør om endringen er tilsiktet eller en bug**:
  - Hvis bug: Fiks koden og kjør tester på nytt
  - Hvis tilsiktet: Følg prosessen for å oppdatere baselines
- Juster `maxDiffPixelRatio` kun hvis nødvendig for mindre rendering-forskjeller

### Unit tests feiler

1. Sjekk at alle avhengigheter er installert: `npm install`
2. Kjør tester i watch mode for debugging: `npm run test:unit:watch`
3. Bruk `--reporter=verbose` for mer detaljert output

### CI-tester feiler

- Sjekk GitHub Actions-logger for spesifikke feil
- Verifiser at produksjonssiden (fyrk.no) er tilgjengelig
- Sørg for at alle dependencies er listet i `package.json`
