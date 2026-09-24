---
title: "Oppdatert utrullingsinfrastruktur for fyrk.no"
date: 2026-09-24
summary: "Intern oppgradering av bygge- og publiseringsverktøy for å sikre stabil og oppdatert utrulling av nettstedet."
tags: [internal]
audience: "internal"
draft: false
---

### Hva er endret

GitHub Actions-steget som konfigurerer publisering til GitHub Pages er oppgradert fra versjon 5 til versjon 6. Endringen påvirker kun byggepipelinen som brukes ved utrulling av fyrk.no.

### Hvorfor det er gjort

Den nye versjonen kjører på Node 24 og inneholder oppdaterte avhengigheter. Dette holder infrastrukturen i tråd med gjeldende støttede versjoner og reduserer risikoen for fremtidige kompatibilitetsproblemer.

### Påvirkning for brukere

Ingen. Dette er en intern endring som ikke berører funksjonalitet, innhold eller verktøyene på fyrk.no (OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief, Beslutningslogg).