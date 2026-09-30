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

Tellerne skrives nå atomisk, slik at tapte oppdateringer fra KV ikke lenger kan oppstå. OKR-fullføringer har vist 0 i alle datoperioder siden hendelsen ble omdøpt 25. september 2026 (`check_success` → `okr_success`), fordi den daglige historikken lå under det gamle navnet. Ved importen til D1 ble den gamle historikken ført over på det nye navnet, så tallene vises igjen.

### Grafer og perioder

Alle perioder (i dag, 7 dager, 30 dager, alle tider) rendres korrekt. Timer og dager i grafene beregnes nå eksplisitt i UTC. Tjenesten kjørte allerede i UTC, så ingen vil se en synlig endring.

### Tilbakerulle ved feil

KV skrives fortsatt parallelt. Skulle noe gå galt med D1, er det tilstrekkelig å rulle tilbake denne PR-en for å gjenopprette forrige atferd.