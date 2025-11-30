# DNS Setup for test.fyrk.no

## Quick Setup Guide

For å få `test.fyrk.no` til å fungere, må du konfigurere DNS:

### Domeneshop DNS Setup

1. **Logg inn på Domeneshop**
   - Gå til ditt domene `fyrk.no`

2. **Legg til CNAME-record:**
   - **Type:** CNAME
   - **Navn:** `test`
   - **Verdi:** `carlfrankalbert.github.io` (eller ditt GitHub username)
   - **TTL:** 3600 (eller standard)

3. **Vent på DNS propagation** (kan ta opptil 48 timer, men ofte raskere)

### GitHub Pages Setup

1. **Gå til GitHub repository**
   - Settings → Pages

2. **For develop branch deployment:**
   - Under "Custom domain" → Legg til `test.fyrk.no`
   - GitHub vil automatisk opprette en CNAME-fil

3. **Verifiser:**
   - GitHub vil vise "DNS check pending" først
   - Når DNS er propagert, vil det vise "DNS check passed"

### Verifisering

Etter DNS-konfigurasjon, test:

```bash
# Sjekk DNS
dig test.fyrk.no CNAME

# Eller
nslookup test.fyrk.no

# Test HTTPS (etter DNS propagation)
curl -I https://test.fyrk.no
```

### Current Setup

- **fyrk.no** → `main` branch (temporary landing page)
- **test.fyrk.no** → `develop` branch (full website)

### Troubleshooting

**DNS ikke propagert:**
- Vent opptil 48 timer
- Sjekk at CNAME-record er korrekt i Domeneshop
- Verifiser at GitHub Pages har custom domain konfigurert

**test.fyrk.no viser feil innhold:**
- Sjekk at develop branch er pushet
- Verifiser GitHub Actions workflow har kjørt
- Sjekk at CNAME-fil er korrekt i dist/CNAME

**HTTPS ikke fungerer:**
- GitHub Pages aktiverer automatisk HTTPS når DNS er korrekt
- Kan ta noen minutter etter DNS propagation

