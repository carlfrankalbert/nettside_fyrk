---
title: "Statistikk skrives nå til D1 i tillegg til KV (fase 1)"
date: 2026-09-29
summary: "Statistikkdata skrives nå parallelt til en ny D1-database for å sikre at besøkstall alltid blir korrekt registrert."
tags: [internal, feature]
audience: "internal"
draft: false
---

### Bakgrunn

KV-lagring av statistikk er sårbar for tapte oppdateringer: når to forespørsler treffer forskjellige edge-lokasjoner tett i tid, kan den ene overskrive den andres endring. 29. september 2026 ble dette bekreftet – en besøkende dukket opp i sidesettet, men manglet i Publikum-telleren.

### Hva er endret

Statistikkendepunktene `/api/pageview` og `/api/track` skriver nå til en ny D1-database (`fyrk-stats`) i tillegg til KV. D1 håndterer hvert besøk som én atomisk operasjon, slik at tellere og besøkshash aldri kan gå tapt eller telles dobbelt.

### Hva brukerne merker

Ingenting. `/stats`-siden leser fortsatt fra KV som før. D1-skriving skjer i bakgrunnen, og en eventuell feil der stopper ikke registreringen.

### Neste steg

Fase 2 kopierer eksisterende KV-historikk inn i D1. Fase 3 flytter lesing av statistikk over til D1 og fjerner KV-skrivingen. Personvernmodellen er uendret: kun aggregerte tellere og anonyme daglige besøkshash – ingen nye data samles inn.