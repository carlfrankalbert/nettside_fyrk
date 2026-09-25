# Testmiljø Setup

## Oversikt

Nettsiden har to miljøer, begge bygget av Cloudflare Workers Builds:

1. **Produksjon** (`main` branch) → `https://fyrk.no`
2. **Preview** (alle andre brancher) → egen preview-URL per branch

## Preview-miljø

Hver branch som pushes bygges av Cloudflare Workers Builds og får en egen
preview-URL på `*-nettside-fyrk.carlfrankalbert.workers.dev` (lenke i PR-en).
Trafikk dit telles ikke i `/stats`. Et eget testdomene (tidligere `test.fyrk.no`)
brukes ikke lenger.

## Workflow

```
feature-branch ──push──▶ Preview-URL (automatisk)
      │
      │ PR + grønn CI
      ▼
    main ──────────────▶ fyrk.no (automatisk)
```

1. Lag en branch fra `main` og push den.
2. Åpne en PR — Workers Builds legger preview-lenken i PR-en.
3. Verifiser endringen på preview-URL-en.
4. Merge til `main` når CI er grønn; Workers Builds deployer til produksjon.

## Lokal utvikling

```bash
npm run dev        # dev-server på http://localhost:4321
npm run build && npm run preview   # produksjonsbygg i workerd
```

## Feilsøking

### Preview-lenken mangler i PR-en
- Sjekk Workers Builds-loggen for `nettside-fyrk` i Cloudflare-dashboardet
- Verifiser at `npm run build` er grønn lokalt

### Preview-URL-en svarer ikke
- Vent noen minutter etter push (bygget tar tid)
- Sjekk at Worker-secrets finnes (se `.dev.vars.example` for listen)
