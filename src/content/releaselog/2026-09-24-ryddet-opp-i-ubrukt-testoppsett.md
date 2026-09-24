---
title: "Ryddet opp i ubrukt testoppsett"
date: 2026-09-24
summary: "Dødt infrastrukturoppsett for test.fyrk.no er fjernet, og dokumentasjonen er oppdatert til å reflektere hvordan staging faktisk fungerer i dag."
tags: [internal, docs]
audience: "internal"
draft: false
---

### Hva ble endret

Arbeidsflyt-filen for deploy til test.fyrk.no, tilhørende dokumentasjon og en overflødig CNAME-fil er fjernet. Disse hadde ikke vært i bruk siden november 2025 og pekte på infrastruktur som ikke lenger eksisterer.

### Hvorfor det ble gjort

`test.fyrk.no` hadde ingen DNS-oppføring, og deploy-prosessen som skulle bruke den kjørte bare på en branch som er slettet. Workers preview-URLer dekker nå behovet for stagingmiljø.

### Oppdatert dokumentasjon

README-en viser nå de arbeidsflytene som faktisk finnes i repoet. `TESTMILJO.md` beskriver Workers previews i stedet for den gamle GitHub Pages-baserte løsningen.

### Ingen påvirkning på brukerne

Endringen er utelukkende intern. Ingen av verktøyene på fyrk.no – OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief eller Beslutningslogg – påvirkes.