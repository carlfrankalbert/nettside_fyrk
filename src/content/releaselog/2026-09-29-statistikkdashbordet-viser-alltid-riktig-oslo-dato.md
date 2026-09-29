---
title: "Statistikkdashbordet viser alltid riktig Oslo-dato"
date: 2026-09-29
summary: "Dashbordet på /stats beregner nå datoer i Oslo-tid, slik at 'I dag'-filteret alltid stemmer og siden slutter å gjenoppbygge seg selv ved innlasting."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva endret seg

Dashbordet på `/stats` beregner nå alltid datoer i Oslo-tid, både på server og i nettleseren. Tidligere ble datoer formatert i UTC på serveren og i nettleserens lokale tidssone hos brukeren – noe som ga en uoverensstemmelse som utløste en React-feil (#418) og fikk siden til å bygge seg opp på nytt ved hver innlasting.

### Hva det betyr i praksis

«I dag»-filteret viser nå alltid riktig dato uavhengig av hvilken tidssone datamaskinen eller telefonen er satt til. Siden laster raskere og uten synlige feil i konsollen.

### Bakgrunn

Feilen ble oppdaget under feilsøking av et mulig problem med periodevalg («I dag» → «7 dager») i Safari på iOS. Selve iOS-problemet er ikke bekreftet løst, men dato-uoverensstemmelsen er nå rettet og kan ha vært en medvirkende årsak.

### Påvirkning

Kun intern bruk (`/stats`). Ingen endringer for besøkende på fyrk.no eller brukere av verktøyene.