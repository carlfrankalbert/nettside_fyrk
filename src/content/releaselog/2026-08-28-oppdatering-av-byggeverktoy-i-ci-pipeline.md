---
title: "Oppdatering av byggeverktøy i CI-pipeline"
date: 2026-08-28
summary: "Interne GitHub Actions-versjoner er oppgradert for å holde byggeprosessen vedlike og sikker."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble endret

GitHub Actions-handlingene som brukes i CI-pipelinen er oppgradert til gjeldende hovedversjoner: `checkout`, `setup-node`, `cache`, `upload-artifact` og `create-pull-request`.

### Effekt for brukere

Ingen. Dette er en ren intern endring som ikke påvirker verktøyene på fyrk.no (OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief eller Beslutningslogg).

### Hvorfor dette ble gjort

Eldre versjoner av GitHub Actions kan etter hvert bli utdatert og miste støtte. Ved å samle flere ventende oppgraderinger i én PR unngås unødvendig mergearbeid, og pipelinen forblir på støttede og vedlikeholdte versjoner.