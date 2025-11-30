# Netlify Setup for test.fyrk.no

## Problem
GitHub Pages støtter kun **én custom domain per repository**. Siden `fyrk.no` allerede er konfigurert på GitHub Pages, kan ikke `test.fyrk.no` bruke samme repository.

## Løsning: Netlify for test.fyrk.no

### Steg 1: Opprett Netlify Site

1. Gå til [Netlify](https://www.netlify.com) og logg inn
2. Klikk på **"Add new site"** → **"Import an existing project"**
3. Velg **GitHub** som provider
4. Velg repository: `carlfrankalbert/nettside_fyrk`
5. Konfigurer:
   - **Branch to deploy:** `develop`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Base directory:** (la stå tom)

### Steg 2: Konfigurer Environment Variables

1. Gå til **Site settings** → **Environment variables**
2. Legg til:
   - **Key:** `SITE`
   - **Value:** `https://test.fyrk.no`

### Steg 3: Konfigurer Custom Domain

1. Gå til **Domain settings**
2. Klikk **"Add custom domain"**
3. Skriv inn: `test.fyrk.no`
4. Netlify vil gi deg DNS-instruksjoner

### Steg 4: Oppdater DNS

1. Gå til Domeneshop DNS-innstillinger
2. Legg til CNAME-record:
   - **Type:** CNAME
   - **Navn:** `test`
   - **Verdi:** `<your-netlify-site>.netlify.app` (fra Netlify)
   - **TTL:** 3600

### Steg 5: Verifiser SSL

1. Netlify vil automatisk sette opp SSL-certifikat
2. Vent på DNS propagation (1-24 timer)
3. SSL vil aktiveres automatisk når DNS er propagert

## Deployment Workflow

- **Automatisk deploy:** Når du pusher til `develop` branch
- **Build:** Netlify kjører `npm run build` automatisk
- **Publish:** Netlify publiserer `dist` mappen

## Oppsummering

- **fyrk.no** → GitHub Pages (main branch) ✅
- **test.fyrk.no** → Netlify (develop branch) ✅

## Feilsøking

### Site viser ikke riktig innhold
- Sjekk at branch er satt til `develop` i Netlify
- Verifiser at build command er `npm run build`
- Sjekk at publish directory er `dist`

### DNS ikke fungerer
- Verifiser CNAME-record i Domeneshop
- Vent på DNS propagation (kan ta opptil 48 timer)
- Sjekk DNS med: `dig test.fyrk.no CNAME`

### SSL ikke aktivert
- Netlify aktiverer SSL automatisk når DNS er korrekt
- Kan ta noen minutter etter DNS propagation

