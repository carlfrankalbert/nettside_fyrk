# Test Subdomain Setup - test.fyrk.no

## Oversikt

Nettsiden er nå konfigurert med to miljøer:

1. **Produksjon** (`main` branch) → `https://fyrk.no` (temporary landing page)
2. **Testmiljø** (`develop` branch) → `https://test.fyrk.no` (full website)

## DNS Konfigurasjon

For å sette opp `test.fyrk.no` subdomain, må du konfigurere DNS:

### Domeneshop DNS Setup

1. Logg inn på Domeneshop
2. Gå til DNS-innstillinger for `fyrk.no`
3. Legg til CNAME-record:
   - **Type:** CNAME
   - **Navn:** `test`
   - **Verdi:** `<github-username>.github.io`
   - **TTL:** 3600 (eller standard)

### GitHub Pages Setup

1. Gå til repository settings → Pages
2. Under "Custom domain" for develop branch deployment:
   - Legg til `test.fyrk.no`
   - GitHub vil automatisk opprette en CNAME-fil


## Deployment Workflow

### Produksjon (fyrk.no)
- **Branch:** `main`
- **Content:** Temporary landing page (logo only)
- **Workflow:** `.github/workflows/deploy.yml`
- **Auto-deploys:** On push to `main`

### Testmiljø (test.fyrk.no)
- **Branch:** `develop`
- **Content:** Full website with all sections
- **Workflow:** `.github/workflows/deploy-test.yml`
- **Auto-deploys:** On push to `develop`

## Verifisering

Etter DNS-konfigurasjon, verifiser:

```bash
# Sjekk DNS propagation
dig test.fyrk.no CNAME

# Test tilgjengelighet
curl -I https://test.fyrk.no
```

## Workflow

```
┌─────────────┐
│   develop   │ → test.fyrk.no (full website)
└─────────────┘

┌─────────────┐
│    main     │ → fyrk.no (temporary landing page)
└─────────────┘
```

## Oppdatering av testmiljøet

1. **Gjør endringer i develop branch:**
   ```bash
   git checkout develop
   # Gjør endringer
   git add .
   git commit -m "Update test environment"
   git push origin develop
   ```

2. **GitHub Actions deployer automatisk** til `test.fyrk.no`

## Oppdatering av produksjon

1. **Når testmiljøet er godkjent:**
   ```bash
   git checkout main
   git merge develop
   # Oppdater index.astro til temporary landing page hvis nødvendig
   git push origin main
   ```

2. **GitHub Actions deployer automatisk** til `fyrk.no`

## Feilsøking

### test.fyrk.no viser ikke riktig innhold
- Sjekk at develop branch er pushet
- Verifiser GitHub Actions workflow har kjørt
- Sjekk DNS CNAME-record er korrekt

### DNS propagation tar tid
- DNS-endringer kan ta opptil 48 timer
- Bruk `dig` eller `nslookup` for å sjekke status

### GitHub Pages custom domain
- Sjekk at CNAME-fil er korrekt i dist/CNAME
- Verifiser GitHub Pages settings har custom domain konfigurert

