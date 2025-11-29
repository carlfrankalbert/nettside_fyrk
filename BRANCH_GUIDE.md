# Guide: Arbeide med branches på Mac

## Se hvilken branch du er på

```bash
git branch
```

Stjerne (*) viser hvilken branch du er på.

## Se alle branches (lokale og remote)

```bash
git branch -a
```

## Bytte mellom branches

### Bytte til develop:
```bash
git checkout develop
```

### Bytte til main:
```bash
git checkout main
```

## Se endringene lokalt

### 1. Start lokal utviklingsserver:
```bash
npm run dev
```

Åpner `http://localhost:4321` i nettleseren.

### 2. Bygg og preview:
```bash
npm run build
npm run preview
```

Åpner `http://localhost:4321` med bygget versjon.

## Arbeidsflyt

### Utvikle i testmiljø (develop):
```bash
# 1. Sjekk ut develop
git checkout develop

# 2. Gjør endringer
# ... rediger filer ...

# 3. Test lokalt
npm run dev

# 4. Commit og push
git add .
git commit -m "Beskrivelse av endring"
git push origin develop
```

### Deploye til produksjon (main):
```bash
# 1. Sjekk ut main
git checkout main

# 2. Merge develop inn i main
git merge develop

# 3. Push til produksjon
git push origin main
```

## Nyttige kommandoer

### Se forskjeller mellom branches:
```bash
git diff main..develop
```

### Se commit-historikk:
```bash
git log --oneline --graph --all
```

### Oppdater develop fra main:
```bash
git checkout develop
git merge main
```

## Tips

- **Alltid test lokalt først** med `npm run dev`
- **Commit ofte** med beskrivende meldinger
- **Push til develop** for å teste deployment
- **Merge til main** når du er fornøyd

