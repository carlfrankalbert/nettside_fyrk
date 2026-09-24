---
title: "Ryddet bort utdaterte driftsguider for GitHub Pages og Domeneshop"
date: 2026-09-24
summary: "Fem utdaterte driftsguider for hosting som ikke lenger er i bruk er fjernet fra kodebasen."
tags: [docs, internal]
audience: "internal"
draft: false
---

### Hva ble gjort

Fem dokumentasjonsfiler under `docs/deployment/` er fjernet. Guidene beskrev oppsett for GitHub Pages, Domeneshop DNS og egendefinert domene via `CNAME`-fil – en hosting-løsning som ikke lenger er i bruk: GitHub Pages ble avviklet i august 2026, og fyrk.no flyttet til Cloudflare Workers i september 2026.

### Hvorfor

fyrk.no kjører i dag på Cloudflare Workers med Cloudflare DNS. De gamle guidene var misvisende og ikke lenger relevante. GitHub Pages var dessuten fortsatt konfigurert til å kreve `fyrk.no` som sitt domene, selv om tjenesten ikke var i aktiv bruk.

### Hva er den gjeldende guiden

Aktuell driftsdokumentasjon finnes i `docs/routines/deploy.md`. Lenker i README, QUICKSTART og docs/README er oppdatert til å peke dit.

### Påvirkning for brukere

Ingen. Endringene er utelukkende interne og påvirker ikke nettsiden eller verktøyene på fyrk.no.