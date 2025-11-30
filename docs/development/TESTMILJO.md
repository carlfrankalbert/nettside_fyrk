# Testmiljø Setup

## Oversikt

Nettsiden har nå to miljøer:

1. **Produksjon** (`main` branch) → `https://fyrk.no`
2. **Testmiljø** (`develop` branch) → GitHub Pages preview URL

## Hvordan bruke testmiljøet

### 1. Opprett develop branch (første gang)

```bash
git checkout -b develop
git push -u origin develop
```

### 2. Utvikle i testmiljøet

1. **Sjekk ut develop branch:**
   ```bash
   git checkout develop
   ```

2. **Gjør endringer og commit:**
   ```bash
   git add .
   git commit -m "Test: min endring"
   git push origin develop
   ```

3. **GitHub Actions deployer automatisk** til preview-miljøet
   - Gå til GitHub → Actions
   - Se deployment URL i workflow-run

### 3. Merge til produksjon

Når du er fornøyd med endringene i testmiljøet:

```bash
git checkout main
git merge develop
git push origin main
```

## GitHub Pages Preview

GitHub Pages preview-miljøet vil ha en URL som:
- `https://<brukernavn>.github.io/nettside_fyrk/` (hvis ikke custom domain)
- Eller en preview URL fra GitHub Actions

**Merk:** For å bruke custom domain (fyrk.no) i testmiljøet, må du:
1. Opprette en egen subdomain (f.eks. `test.fyrk.no` eller `staging.fyrk.no`)
2. Eller bruke preview URL fra GitHub Actions

## Lokal utvikling

For lokal testing:

```bash
npm run dev
```

Åpner `http://localhost:4321`

## Workflow

```
┌─────────────┐
│   develop   │ → Testmiljø (automatisk deploy)
└──────┬──────┘
       │
       │ (når klar)
       ▼
┌─────────────┐
│    main     │ → Produksjon (fyrk.no)
└─────────────┘
```

## Tips

- **Test alltid i testmiljø først** før du merger til main
- **Bruk beskrivende commit-meldinger** for å holde oversikt
- **Sjekk GitHub Actions** for deployment status
- **Preview URL** finnes i workflow-run output

## Feilsøking

### Preview deployer ikke
- Sjekk at `develop` branch eksisterer
- Sjekk GitHub Actions for feilmeldinger
- Verifiser at workflow-filen er korrekt

### Preview URL fungerer ikke
- Vent noen minutter etter push (deployment tar tid)
- Sjekk GitHub Pages settings i repository
- Verifiser at Pages er aktivert for preview environment

