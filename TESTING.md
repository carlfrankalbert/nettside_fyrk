# Testing

## Én kommando for deploy-ro

```bash
npm run test
```

Denne kommandoen kjører:
1. **TypeScript check** - Verifiserer typesikkerhet
2. **ESLint** - Konsistent kodestil
3. **Unit-tester** - Vitest på services og utils
4. **E2E smoke** - Playwright på kritiske sider

Grønn = trygt å shippe.

---

## Pre-commit hooks

Prosjektet bruker Husky for pre-commit hooks:
- **Typecheck** - Kjører `astro check` før hver commit
- **Lint-staged** - Linter kun endrede filer

Installeres automatisk med `npm install` via `prepare` script.

---

## Hva testes hvor

### Test-pyramide

```
         ┌─────────────────────────┐
         │   E2E (Playwright)      │  Få, kritiske journeys
         │   - Landing → CTA       │
         │   - OKR happy path      │
         │   - Konseptspeilet      │
         │   - Feilsider           │
         └───────────┬─────────────┘
                     │
    ┌────────────────┴────────────────┐
    │   Unit/Integration (Vitest)     │  Forretningslogikk
    │   - form-validation             │
    │   - okr-parser                  │
    │   - konseptspeil-parser         │
    │   - okr-service (mocked)        │
    └────────────────┬────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │   Static Analysis               │  Alltid først
    │   - TypeScript strict           │
    │   - ESLint                      │
    └─────────────────────────────────┘
```

### Unit-tester (Vitest)
- **Hvor:** `src/**/*.test.ts`
- **Hva:** Parsers, validering, service-logikk med mocked fetch
- **Kjør:** `npm run test:unit`

### E2E-tester (Playwright)
- **Hvor:** `tests/*.smoke.ts`, `tests/*.spec.ts`
- **Hva:** Kritiske brukerreiser, visuell regresjon, kontrast
- **Kjør:** `npm run test:e2e` (smoke) eller `npm run test:e2e:all`

### A11y-tester (axe-core)
- **Hvor:** `tests/a11y.spec.ts`
- **Hva:** WCAG 2.1 AA brudd på nøkkelsider
- **Kjør:** `npm run test:a11y`

---

## Kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run test` | **Golden command** - typecheck + lint + unit + smoke |
| `npm run typecheck` | TypeScript-sjekk |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint med auto-fix |
| `npm run test:unit` | Vitest unit-tester |
| `npm run test:unit:watch` | Vitest i watch mode |
| `npm run test:unit:coverage` | Unit-tester med coverage |
| `npm run test:e2e` | Playwright smoke-tester |
| `npm run test:e2e:all` | Alle Playwright-prosjekter |
| `npm run test:a11y` | Accessibility-tester |
| `npm run test:konseptspeilet` | Konseptspeilet E2E |
| `npm run test:ui` | Playwright interaktiv UI |

---

## Skrive nye tester

### Unit-tester

1. Lag fil ved siden av koden: `my-util.test.ts`
2. Bruk Arrange-Act-Assert:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-util';

describe('myFunction', () => {
  it('returns expected value for valid input', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### E2E-tester

1. Lag fil i `tests/`: `my-feature.smoke.ts`
2. Hold testene korte og stabile:

```typescript
import { test, expect } from '@playwright/test';

test('user can complete primary action', async ({ page }) => {
  await page.goto('/my-page');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

### E2E med API-mocking

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('**/api/my-endpoint', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: 'mocked' }),
    });
  });
});
```

---

## CI

### PR-workflow (`ci.yml`)
Kjører automatisk på PR til main:
1. TypeScript check
2. ESLint
3. Unit-tester
4. E2E smoke
5. A11y-tester

Artifacts lastes opp kun ved feil.

### Nightly (`nightly.yml`)
Kjører kl 03:00 UTC hver dag:
- Full test suite inkludert alle Playwright-prosjekter
- Coverage-rapport

---

## Vanlige problemer

### Playwright timeout
```bash
# Øk timeout i testen:
test.setTimeout(60000);

# Eller kjør med debug:
PWDEBUG=1 npm run test:e2e
```

### Vitest finner ikke modul
```bash
# Sjekk at happy-dom er installert:
npm ls happy-dom

# Reinstaller dependencies:
rm -rf node_modules && npm ci
```

### TypeScript-feil i .astro
```bash
# Kjør astro check direkte:
npx astro check

# Se detaljert output:
npx astro check --verbose
```

### ESLint-feil
```bash
# Auto-fix der mulig:
npm run lint:fix

# Se spesifikk fil:
npx eslint src/my-file.ts
```

### A11y-tester feiler
A11y-testene failer kun på `critical` og `serious` brudd. Sjekk console-output for detaljer om hvilket element som feiler og hvorfor. Bruk [deque axe extension](https://www.deque.com/axe/browser-extensions/) for debugging i nettleseren.

### Pre-commit hook feiler
```bash
# Bypass midlertidig (bruk sjelden):
git commit --no-verify -m "message"

# Reinstaller hooks:
npx husky install
```

---

## Hva vi bevisst ikke tester

- **Visuelt layout** - bruker visual regression snapshots (kjør `npm run test:visual`)
- **Tredjeparts API-respons** - mocker Anthropic-kall
- **Full a11y-compliance** - kun alvorlige brudd blokkerer
