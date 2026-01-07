# Testing

## Formål

Testregimet i FYRK er designet for å beskytte det som er kostbart å få feil i produksjon: førsteinntrykk, brukerflyt og kjernefunksjonalitet i AI-verktøyene.

Målet er ikke maksimal testdekning, men **trygghet og ro** i deploy-beslutninger. Testene skal gi signal når noe viktig er i ferd med å gå galt – og holde seg stille når alt er som det skal.

---

## Kvalitetsnivåer

FYRK bruker en pragmatisk test-pyramide med fire nivåer:

### Statisk analyse
TypeScript og ESLint fanger feil før koden kjøres. Dette er den raskeste og billigste formen for kvalitetssikring.

- **Beskytter:** Typefeil, inkonsistent kode, ubrukte variabler
- **Effekt:** Forhindrer hele kategorier av bugs fra å nå runtime

### Unit- og integrasjonstester
Vitest tester forretningslogikk isolert fra UI. Alle eksterne avhengigheter (API-kall, nettleser) er mocket.

- **Beskytter:** Parsere, validering, service-logikk
- **Effekt:** Sikrer at kjernefunksjoner fungerer korrekt under kontrollerte forhold

### End-to-end-tester
Playwright simulerer ekte brukerreiser i en faktisk nettleser. API-kall mockes for stabilitet og hastighet.

- **Beskytter:** Kritiske brukerflyter (landing → CTA, OKR-sjekken, Konseptspeilet)
- **Effekt:** Verifiserer at systemet fungerer som helhet fra brukerens perspektiv

### Tilgjengelighet (lett)
Axe-core sjekker nøkkelsider for alvorlige WCAG-brudd. Kun `critical` og `serious` funn blokkerer.

- **Beskytter:** Grunnleggende tilgjengelighet for skjermlesere og tastaturnavigasjon
- **Effekt:** Forhindrer de mest pinlige tilgjengelighetsfeilene

---

## Quality Gates

Før merge til main og deploy må følgende være grønt:

| Gate | Verktøy | Blokkerer |
|------|---------|-----------|
| Typecheck | `astro check` | Ja |
| Lint | ESLint | Ja |
| Unit-tester | Vitest | Ja |
| E2E smoke | Playwright | Ja |
| A11y | axe-core | Ja (kun critical/serious) |

**Når `npm run test` er grønt, kan vi deploye med ro.**

Pre-commit hooks kjører automatisk typecheck og lint på endrede filer, slik at de fleste feil fanges før commit.

---

## Hvordan kjøre testene

### Golden command

```bash
npm run test
```

Kjører hele kvalitetssuiten: typecheck → lint → unit → E2E smoke.

### Enkeltkommandoer

| Kommando | Når du bruker den |
|----------|-------------------|
| `npm run typecheck` | Verifisere TypeScript etter refaktorering |
| `npm run lint` | Sjekke kodestil |
| `npm run lint:fix` | Auto-fikse lint-feil |
| `npm run test:unit` | Raskt verifisere forretningslogikk |
| `npm run test:unit:watch` | Under utvikling av ny logikk |
| `npm run test:e2e` | Verifisere kritiske brukerflyter |
| `npm run test:a11y` | Sjekke tilgjengelighet |
| `npm run test:visual` | Manuell visuell regresjonstest |
| `npm run test:ui` | Debugge E2E-tester interaktivt |

---

## Nåværende oppsett

### Statisk analyse
- **ESLint** med flat config for TypeScript og Astro
- Integrert i pre-commit hooks via Husky og lint-staged
- Pragmatisk regelset som fanger reelle feil uten å være pedantisk

### Unit-tester
- **Vitest** med happy-dom for DOM-simulering
- Dekker form-validering, OKR-parser, konseptspeil-parser, og okr-service
- 78 tester med god dekning av forretningslogikk

### E2E-tester
- **Playwright** med prosjekter for smoke, a11y, visual, og spesifikke features
- Konseptspeilet har full E2E-dekning med API-mocking (6 tester)
- OKR-sjekken dekkes via smoke-tester og dedikert spec

### CI/CD
- **PR-workflow** kjører alle quality gates parallelt
- **Nightly** kjører full suite med coverage-rapport kl 03:00 UTC
- Artefakter lastes kun opp ved feil

### Pre-commit hooks
- Typecheck kjører på alle commits
- Lint-staged kjører ESLint på endrede filer
- Kan bypasses med `--no-verify` ved behov (bruk sjelden)

---

## Hva som bevisst ikke er testet

Følgende er bevisste valg, ikke mangler:

| Område | Begrunnelse |
|--------|-------------|
| Ekte Anthropic API-kall | Mockes for stabilitet, hastighet og kostnadskontroll |
| Full visual regression | Kjøres manuelt ved behov; automatisering gir for mye støy |
| Komplett WCAG-compliance | Fokuserer på alvorlige brudd; full compliance er et designansvar |
| Load/performance testing | Kjøres manuelt med k6 ved behov; ikke del av CI |

---

## Neste forbedringer

Når det gir mening:

1. **Utvide E2E-journeys** når produktflyt endres eller nye features lanseres
2. **Vedlikeholde visual baselines** ved større designendringer
3. **Vurdere strengere a11y** hvis brukergruppen krever det
4. **Legge til flere unit-tester** for nye services og utils

---

## Feilsøking

### Pre-commit feiler
```bash
# Bypass midlertidig (bruk sjelden):
git commit --no-verify -m "message"
```

### E2E timeout
```bash
# Debug interaktivt:
PWDEBUG=1 npm run test:e2e
```

### Vitest finner ikke modul
```bash
rm -rf node_modules && npm ci
```

For mer detaljert feilsøking, se kommentarer i de individuelle testfilene.

---

## Før du pusher til CI

Kjør alltid testene lokalt før push for å unngå unødvendige CI-feil:

```bash
# 1. Rask sjekk (typecheck + lint)
npm run typecheck && npm run lint

# 2. Unit-tester
npm run test:unit

# 3. Full lokal suite (anbefalt før push)
npm run test
```

### Vanlige CI-feil og løsninger

| Problem | Årsak | Løsning |
|---------|-------|---------|
| `#a3a3a3` kontrastfeil | Tailwind neutral-400/500 for lys på lys bakgrunn | Bruk `neutral-600` eller mørkere |
| Strict mode violation | Selector matcher flere elementer | Legg til `.first()` |
| Button not found | Feil selector (type="submit" vs type="button") | Bruk `getByRole('button', { name: /tekst/i })` |
| SSE mock feiler | Feil format på streaming response | Bruk `data: {...}\n\ndata: [DONE]\n\n` |
| E2E timeout | WebServer starter ikke | Sjekk at port 4321 er ledig |

### CI re-run trigger

GitHub "Re-run" knappen kjører samme commit. For å kjøre CI mot nyeste kode:

```bash
git commit --allow-empty -m "Trigger CI" && git push
```

---

## Hvordan dette brukes i praksis

Under utvikling fanger pre-commit hooks de fleste feil før koden forlater din maskin. Ved PR kjører CI alle quality gates automatisk – typecheck, lint, unit og E2E smoke. Nightly kjører full suite med coverage for å fange regresjoner som slipper gjennom.

Før deploy er regelen enkel: kjør `npm run test` lokalt. Når `npm run test` er grønt, kan vi deploye med ro.

Dette er ikke et perfekt system – det er et pragmatisk system som gir oss trygghet i de beslutningene som teller.

---

*Dette dokumentet følger FYRK Quality Standard.*
