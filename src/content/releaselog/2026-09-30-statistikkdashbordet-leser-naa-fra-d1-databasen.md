---
title: "Statistikkdashbordet leser nå fra D1-databasen"
date: 2026-09-30
summary: "Det interne statistikkdashbordet på /stats henter nå alle tall direkte fra D1, noe som gir nøyaktige tellere og fikser manglende OKR-fullføringer."
tags: [internal, fix, feature]
audience: "internal"
draft: false
---

### Hva er endret

Dashbordet på `/stats`, trafikk-grafene og anskaffelsesdata henter nå alle tall fra D1-databasen i stedet for KV. Dette er fase 3 av den pågående migreringen til D1.

### Nøyaktige tall igjen

Tellerne skrives nå atomisk, slik at tapte oppdateringer fra KV ikke lenger kan oppstå. OKR-fullføringer som har vist 0 siden 25. september 2026 vises nå korrekt igjen – feilen skyldtes at hendelsesnavnet ble omdøpt etter at historikken ble importert.

### Grafer og perioder

Alle perioder (i dag, 7 dager, 30 dager, alle tider) rendres korrekt. Timer og dager i grafene er nå eksplisitt merket som UTC, men siden tjenesten allerede kjørte i UTC vil ingen se en synlig endring.

### Tilbakerulle ved feil

KV skrives fortsatt parallelt. Skulle noe gå galt med D1, er det tilstrekkelig å rulle tilbake denne PR-en for å gjenopprette forrige atferd.