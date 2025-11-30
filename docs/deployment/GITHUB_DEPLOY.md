# GitHub Deployment Guide

## Steg 1: Initialiser Git repository

```bash
# Initialiser git repository
git init

# Legg til alle filer
git add .

# Lag første commit
git commit -m "Initial commit: Fyrk nettside"
```

## Steg 2: Koble til GitHub repository

```bash
# Legg til remote (hvis du ikke allerede har gjort det)
git remote add origin https://github.com/carlfrankalbert/nettside_fyrk.git

# Eller hvis remote allerede eksisterer, oppdater den:
git remote set-url origin https://github.com/carlfrankalbert/nettside_fyrk.git

# Sjekk at remote er riktig
git remote -v
```

## Steg 3: Push til GitHub

```bash
# Push til main branch
git branch -M main
git push -u origin main
```

## Steg 4: Konfigurer GitHub Pages

1. Gå til repository på GitHub: https://github.com/carlfrankalbert/nettside_fyrk
2. Klikk på **Settings** (innstillinger)
3. I venstre meny, klikk på **Pages**
4. Under **Source**, velg:
   - **Source**: `GitHub Actions`
5. Lagre innstillingene

## Steg 5: Aktiver GitHub Actions

1. Gå til **Actions** fanen i repository
2. Hvis du ser en melding om å aktivere workflows, klikk **"I understand, enable workflows"**
3. Workflow vil automatisk kjøre når du pusher til `main` branch

## Steg 6: Sjekk deployment

1. Etter push, gå til **Actions** fanen
2. Du vil se en workflow kjøre som heter "Deploy to GitHub Pages"
3. Når den er ferdig (grønn checkmark), gå tilbake til **Settings > Pages**
4. Du vil se nettadressen din, typisk: `https://carlfrankalbert.github.io/nettside_fyrk/`

## Viktige notater

### Hvis du bruker custom domain (fyrk.no)

1. I repository **Settings > Pages**, legg til ditt custom domain
2. Oppdater `astro.config.mjs` hvis nødvendig med riktig `site` URL
3. Legg til CNAME fil i `public/` mappen hvis GitHub krever det

### For å oppdatere nettsiden

```bash
# Gjør endringer i koden
# Legg til endringene
git add .

# Commit
git commit -m "Beskrivelse av endringene"

# Push til GitHub
git push origin main
```

GitHub Actions vil automatisk bygge og deploye når du pusher til `main` branch.

## Troubleshooting

### Workflow feiler
- Sjekk at `package.json` har alle nødvendige dependencies
- Sjekk Actions log for feilmeldinger
- Sørg for at Node.js versjon er kompatibel (workflow bruker v20)

### Nettsiden vises ikke
- Vent noen minutter etter deployment
- Sjekk at GitHub Pages er aktivert med "GitHub Actions" som source
- Sjekk at workflow har kjørt og er vellykket

### Custom domain
- Hvis du skal bruke fyrk.no, må du konfigurere DNS
- Legg til CNAME record som peker til GitHub Pages URL
- Legg til domain i GitHub Pages settings

