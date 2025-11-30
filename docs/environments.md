# Miljøer og Branch-struktur

## Oversikt

Dette prosjektet bruker to hovedbranches for å separere utvikling og produksjon:

- **`dev`** - Utviklingsmiljø
- **`main`** - Produksjonsmiljø

## Dev Branch (`dev`)

**Bruksområde:** Utvikling og testing av nye features

**Deployment:**
- Automatisk deploy til GitHub Pages dev-miljø ved push til `dev` branch
- Dev-URL: Se GitHub Pages settings for dev environment URL
- Feature flag: `PUBLIC_FEATURE_FULL_SITE_ENABLED=true` (alltid aktivert i dev)

**Workflow:**
1. Opprett feature branch fra `dev`
2. Utvikle og test lokalt
3. Merge til `dev` → automatisk deploy til dev-miljø
4. Test i dev-miljø før merge til `main`

## Main Branch (`main`)

**Bruksområde:** Produksjon

**Deployment:**
- Automatisk deploy til GitHub Pages produksjonsmiljø ved push til `main` branch
- Prod-URL: `https://fyrk.no` (eller GitHub Pages URL)
- Feature flag: `PUBLIC_FEATURE_FULL_SITE_ENABLED=false` (standard - kun landing page)

**Workflow:**
1. Når `dev` er testet og klar for produksjon
2. Merge `dev` → `main`
3. Automatisk deploy til produksjon
4. Prod viser landing page inntil feature flag aktiveres

## Feature Flag

Prosjektet bruker `PUBLIC_FEATURE_FULL_SITE_ENABLED` environment variable for å kontrollere om full site eller kun landing page vises:

- **Dev:** Alltid `true` (full site alltid synlig)
- **Prod:** Standard `false` (kun landing page), sett til `true` når klar for lansering

Se [deployment-flow.md](./deployment-flow.md) for detaljer om hvordan endre feature flag.

## Best Practices

1. **Alltid test i dev først** - Test alle endringer i dev-miljø før merge til main
2. **Bruk feature branches** - Opprett feature branches fra `dev` for nye features
3. **Kontroller feature flag** - Sjekk at feature flag er riktig satt før merge til main
4. **Test produksjonsbygget lokalt** - Bruk `npm run build && npm run preview` før deploy

