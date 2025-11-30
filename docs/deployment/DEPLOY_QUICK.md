# Quick Deploy til GitHub

## Snarvei - Kopier og lim inn i terminal:

```bash
# 1. Initialiser git
git init

# 2. Legg til alle filer
git add .

# 3. Lag første commit
git commit -m "Initial commit: Fyrk nettside"

# 4. Legg til remote (hvis ikke allerede gjort)
git remote add origin https://github.com/carlfrankalbert/nettside_fyrk.git

# 5. Push til GitHub
git branch -M main
git push -u origin main
```

## Etter push:

1. Gå til: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Under "Source", velg: **GitHub Actions**
3. Lagre
4. Gå til **Actions** fanen og vent på at workflow kjører
5. Når ferdig, nettsiden vil være tilgjengelig på:
   - `https://carlfrankalbert.github.io/nettside_fyrk/`
   - Eller ditt custom domain hvis konfigurert

## For custom domain (fyrk.no):

1. I GitHub Pages settings, legg til `fyrk.no` som custom domain
2. Konfigurer DNS med CNAME record som peker til GitHub Pages
3. Vent på at SSL sertifikat blir generert (kan ta noen minutter)

