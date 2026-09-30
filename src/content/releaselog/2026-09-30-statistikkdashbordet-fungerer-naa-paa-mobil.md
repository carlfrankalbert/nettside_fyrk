---
title: "Statistikkdashbordet fungerer nå på mobil"
date: 2026-09-30
summary: "Forklaringsikoner, kortlayout og innlogging er forbedret på /stats, slik at dashbordet er brukbart på telefon."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Forklaringer åpner på trykk

ⓘ-ikonene som forklarer KPI-er og seksjoner fungerer nå på telefon – tidligere krevde de hover og var derfor utilgjengelige på touch-skjermer. Et trykk åpner forklaringen, et nytt trykk utenfor (eller Escape) lukker den. Forklaringen holder seg innenfor skjermkanten også på smale skjermer.

I tillegg er en feil rettet der ⓘ-ikonet i «Anskaffelse»- og «Publikum»-overskriftene utilsiktet åpnet og lukket seksjonen i stedet for å vise forklaringen.

### KPI-kortene flyter ikke ut på smale skjermer

På iPhone SE (320 px) og lignende smale telefoner fikk siden tidligere et horisontalt scroll. KPI-kortene har nå noe mindre padding, pynteikonene skjules på smale skjermer, og kortene vises i én kolonne under 360 px. Periodeknappene brytes heller ikke lenger over flere rader.

### Innloggingen varer 30 dager

Tidligere ble sesjonen ugyldig etter 8 timer, slik at en åpen fane viste «Token mangler» ved neste periodebytte. Innloggingskaken varer nå 30 dager. Kaken gir kun lesetilgang til aggregert statistikk og er satt til httpOnly, Secure og SameSite=Lax.

### Øvrige justeringer

Kortoverskrifter som «Nettverk (organisasjon)» og «Aktivitet per time» vises nå i normal tekststørrelse i stedet for å arve nettstedets globale overskriftstil.