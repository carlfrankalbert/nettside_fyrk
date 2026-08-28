---
title: "Ryddet bort utdaterte deploy-prosesser"
date: 2026-08-28
summary: "To gamle, ikke-fungerende deploy-arbeidsflyter er fjernet fra byggpipelinen."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble endret

To GitHub Actions-arbeidsflyter som håndterte deploy til GitHub Pages er fjernet: én for produksjon og én for forhåndsvisning. Disse har ikke vært i bruk siden fyrk.no ble migrert til Cloudflare Pages, og har generert feilmeldinger i byggloggen siden desember.

### Ingen endring for brukere

Dette påvirker ikke nettsiden, verktøyene (OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief, Beslutningslogg) eller noen annen funksjonalitet. Produksjon og forhåndsvisning håndteres nå utelukkende av Cloudflare Pages.

### Hvorfor det likevel er viktig

Falske feilmeldinger i CI gjør det vanskeligere å oppdage reelle problemer. Ved å fjerne disse arbeidsflytene er byggestatus nå et pålitelig signal.