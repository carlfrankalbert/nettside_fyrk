# Test Route Setup - fyrk.no/test

## Oversikt

Testmiljøet er nå konfigurert som en route på hoveddomenet i stedet for en subdomain:

- **Produksjon** (`main` branch) → `https://fyrk.no` (temporary landing page)
- **Testmiljø** (`develop` branch) → `https://fyrk.no/test` (full website, IP whitelisted)

## IP Whitelisting

Test-ruten er beskyttet med IP whitelisting. Kun autoriserte IP-adresser kan se innholdet.

### Konfigurering

1. **Legg til whitelisted IP-adresser i GitHub Secrets:**
   - Gå til repository → Settings → Secrets and variables → Actions
   - Legg til en ny secret: `WHITELISTED_IPS`
   - Verdi: Komma-separerte IP-adresser (f.eks. `123.45.67.89,98.76.54.32`)

2. **For Netlify (hvis du bruker Netlify):**
   - Gå til Site settings → Environment variables
   - Legg til: `PUBLIC_WHITELISTED_IPS` med samme verdi

### Hvordan det fungerer

- Når noen besøker `/test`, sjekkes deres IP-adresse mot whitelisten
- Hvis IP-en er whitelisted, vises full site
- Hvis IP-en ikke er whitelisted, vises en "Tilgang begrenset" melding

## Deployment Workflow

### Produksjon (fyrk.no)
- **Branch:** `main`
- **Content:** Temporary landing page (logo only)
- **Workflow:** `.github/workflows/deploy.yml`
- **Auto-deploys:** On push to `main`

### Testmiljø (fyrk.no/test)
- **Branch:** `develop`
- **Content:** Full website with all sections
- **Workflow:** `.github/workflows/deploy-test.yml`
- **Auto-deploys:** On push to `develop`
- **Access:** IP whitelisted

## Fordeler med fyrk.no/test vs test.fyrk.no

1. **Ingen ekstra DNS-konfigurasjon** - Bruker samme domene som produksjon
2. **Enklere SSL** - Samme sertifikat som hoveddomenet
3. **Bedre for SEO** - Alt under samme domene
4. **IP whitelisting** - Kan begrense tilgang til testmiljøet

## Verifisering

Etter deployment, test:

```bash
# Test tilgjengelighet
curl -I https://fyrk.no/test

# Test med din IP (skal vise innhold hvis whitelisted)
curl https://fyrk.no/test
```

## Feilsøking

### Test-ruten viser "Tilgang begrenset"
- Sjekk at din IP-adresse er lagt til i `WHITELISTED_IPS` secret
- Verifiser at IP-en er korrekt (sjekk din IP på https://api.ipify.org)
- Sjekk at environment variable er satt i GitHub Actions workflow

### Test-ruten viser 404
- Sjekk at `/test` route er bygget (sjekk `src/pages/test/index.astro` eksisterer)
- Verifiser at build har kjørt etter at filen ble lagt til
- Sjekk GitHub Actions workflow logs

### IP-sjekk fungerer ikke
- Sjekk browser console for feilmeldinger
- Verifiser at `api.ipify.org` er tilgjengelig (noen nettverk kan blokkere dette)
- Hvis du bruker Netlify, vurder å bruke Netlify's innebygde IP whitelisting i stedet

