---
title: "Statistikksiden laster igjen for alle perioder"
date: 2026-09-29
summary: "Dashbordet på /stats fungerer nå for alle tidsperioder og diagrammer, etter at en intern ytelsesgrense ble overskredet ved hver forespørsel."
tags: [perf, internal]
audience: "internal"
draft: false
---

### Hva var problemet?

Statistikksiden (`/stats`) krasjet konsekvent for «30 dager»-visningen, og diagrammet for «Alt» lastet ikke. Årsaken var at siden gjorde én separat oppslag per nøkkel i datalagringsystemet – opptil 3 200 oppslag per sideinnlasting – mot en grense på 1 000. Resultatet var en 500-feil hver gang.

### Hva er fikset?

Oppslag kjøres nå i parallelle bulklesinger der opptil 100 nøkler hentes i én operasjon. Alle fire tidsperioder og alle diagramendepunkter laster igjen. Siden er også raskere generelt, siden lesingene skjer samtidig i stedet for én og én.

### Feilhåndtering

Hvis datalageret skulle feile, vises nå et tydelig feilkort med en «Prøv igjen»-knapp i stedet for en generisk 500-side.

### Påvirkning

Kun internt. Ingen endringer i verktøyene eller brukervendte sider på fyrk.no. Samme data vises som før, og tilgangskontroll er uendret.