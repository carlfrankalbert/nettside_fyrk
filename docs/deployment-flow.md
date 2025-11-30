# Deployment Flow og Feature Flag Guide

## Oversikt

Dette prosjektet bruker en feature flag-basert deployment-strategi med to miljøer:

- **Dev miljø** (`dev` branch) → Alltid viser full site
- **Prod miljø** (`main` branch) → Standard: landing page, kan aktiveres til full site

## Workflow

### Utvikling → Dev

```
Feature Branch → dev branch → Auto deploy til dev-miljø
```

1. **Opprett feature branch:**
   ```bash
   git checkout dev
   git checkout -b feature/min-feature
   ```

2. **Utvikle og test lokalt:**
   ```bash
   npm run dev
   # Test på http://localhost:4321
   ```

3. **Commit og push:**
   ```bash
   git add .
   git commit -m "feat: min nye feature"
   git push origin feature/min-feature
   ```

4. **Merge til dev:**
   ```bash
   git checkout dev
   git merge feature/min-feature
   git push origin dev
   ```

5. **Automatisk deploy:**
   - GitHub Actions trigger automatisk på push til `dev`
   - Deployer til dev-miljø med `PUBLIC_FEATURE_FULL_SITE_ENABLED=true`
   - Full site vises alltid i dev-miljø

### Dev → Prod

```
dev branch → main branch → Auto deploy til prod
```

1. **Når dev er testet og klar:**
   ```bash
   git checkout main
   git merge dev
   git push origin main
   ```

2. **Automatisk deploy:**
   - GitHub Actions trigger automatisk på push til `main`
   - Deployer til prod med `PUBLIC_FEATURE_FULL_SITE_ENABLED=false` (standard)
   - Prod viser landing page inntil feature flag aktiveres

## Feature Flag

### Hva er Feature Flag?

`PUBLIC_FEATURE_FULL_SITE_ENABLED` er en environment variable som kontrollerer om landing page eller full site vises.

### Feature Flag Logikk

| Miljø | Branch | Feature Flag | Resultat |
|-------|--------|--------------|----------|
| Dev | `dev` | `true` (alltid) | Full site vises |
| Prod | `main` | `false` (standard) | Landing page vises |
| Prod | `main` | `true` (når aktivert) | Full site vises |

### Hvor settes Feature Flag?

Feature flag settes i GitHub Actions workflows:

#### Dev Miljø (`deploy-dev.yml`)

```yaml
env:
  PUBLIC_FEATURE_FULL_SITE_ENABLED: 'true'  # Alltid aktivert i dev
```

#### Prod Miljø (`deploy-prod.yml`)

```yaml
env:
  # Standard: false (kun landing page)
  # Endre til 'true' når klar for lansering
  PUBLIC_FEATURE_FULL_SITE_ENABLED: ${{ secrets.PUBLIC_FEATURE_FULL_SITE_ENABLED || 'false' }}
```

### Hvordan aktivere Full Site i Prod?

#### Metode 1: Via GitHub Secrets (Anbefalt)

1. Gå til: `https://github.com/carlfrankalbert/nettside_fyrk/settings/secrets/actions`
2. Klikk "New repository secret"
3. Navn: `PUBLIC_FEATURE_FULL_SITE_ENABLED`
4. Verdi: `true`
5. Lagre
6. Push til `main` → automatisk deploy med full site aktivert

#### Metode 2: Direkte i Workflow (Temporary)

1. Rediger `.github/workflows/deploy-prod.yml`
2. Endre linjen:
   ```yaml
   PUBLIC_FEATURE_FULL_SITE_ENABLED: 'true'  # Endre fra 'false'
   ```
3. Commit og push til `main`

### Hvordan deaktivere Full Site i Prod?

1. Fjern secret `PUBLIC_FEATURE_FULL_SITE_ENABLED` fra GitHub Secrets
2. Eller endre workflow til `'false'`
3. Push til `main` → automatisk deploy med landing page

## GitHub Pages Setup

### Dev Miljø

1. Gå til: `https://github.com/carlfrankalbert/nettside_fyrk/settings/pages`
2. Under "Source", velg:
   - **Source:** GitHub Actions
   - **Environment:** `dev-environment`
3. Dev-URL vil være tilgjengelig etter første deploy

### Prod Miljø

1. Gå til: `https://github.com/carlfrankalbert/nettside_fyrk/settings/pages`
2. Under "Source", velg:
   - **Source:** GitHub Actions
   - **Environment:** `production`
3. For custom domain:
   - Legg til custom domain i Pages settings
   - Sett `SITE` secret i GitHub Secrets
   - Konfigurer DNS CNAME record

## Custom Domain Setup

### Steg 1: Legg til Domain i GitHub Pages

1. Gå til repository Settings → Pages
2. Under "Custom domain", legg til ditt domene (f.eks. `fyrk.no`)
3. GitHub vil automatisk validere DNS

### Steg 2: Sett SITE Secret

1. Gå til: `https://github.com/carlfrankalbert/nettside_fyrk/settings/secrets/actions`
2. Legg til secret:
   - Navn: `SITE`
   - Verdi: `https://fyrk.no`

### Steg 3: Konfigurer DNS

1. Gå til din DNS-provider (f.eks. Domeneshop)
2. Legg til CNAME record:
   - Type: CNAME
   - Navn: `@` eller `www`
   - Verdi: `carlfrankalbert.github.io`
   - TTL: 3600

### Steg 4: Vent på DNS Propagation

- DNS-endringer kan ta opptil 48 timer
- Vanligvis raskere (1-24 timer)
- Sjekk med: `dig fyrk.no CNAME`

## Troubleshooting

### Dev viser ikke full site

- Sjekk at `PUBLIC_FEATURE_FULL_SITE_ENABLED=true` i `deploy-dev.yml`
- Verifiser at workflow har kjørt
- Sjekk GitHub Actions logs

### Prod viser ikke landing page

- Sjekk at `PUBLIC_FEATURE_FULL_SITE_ENABLED=false` eller ikke satt
- Verifiser at workflow har kjørt
- Sjekk GitHub Actions logs

### Custom domain fungerer ikke

- Verifiser DNS CNAME record
- Sjekk at `SITE` secret er satt riktig
- Vent på DNS propagation
- Sjekk GitHub Pages settings for domain status

### Deployment feiler

- Sjekk GitHub Actions logs
- Verifiser at Node.js versjon er korrekt (20)
- Sjekk at alle dependencies er installert
- Verifiser at build command fungerer lokalt

## Best Practices

1. **Test alltid i dev først** - Test alle endringer i dev-miljø før merge til main
2. **Bruk feature branches** - Opprett feature branches fra `dev` for nye features
3. **Kontroller feature flag** - Verifiser at feature flag er riktig satt før deploy
4. **Test produksjonsbygget lokalt** - Bruk `npm run build && npm run preview` før deploy
5. **Dokumenter endringer** - Bruk beskrivende commit-meldinger

## Neste Steg

Når du er klar for å lansere full site i produksjon:

1. Test grundig i dev-miljø
2. Merge `dev` → `main`
3. Sett `PUBLIC_FEATURE_FULL_SITE_ENABLED=true` i GitHub Secrets
4. Push til `main` → automatisk deploy med full site aktivert

