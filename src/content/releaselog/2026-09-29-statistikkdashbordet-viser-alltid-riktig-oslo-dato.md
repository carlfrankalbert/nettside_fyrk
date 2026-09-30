---
title: "Statistikkdashbordet viser alltid riktig Oslo-dato"
date: 2026-09-29
summary: "Dashbordet på /stats viser nå datoer i Oslo-tid både på server og i nettleseren, slik at siden slutter å bygge seg opp på nytt ved innlasting."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva endret seg

Dashbordet på `/stats` viser nå alltid datoer i Oslo-tid, både på server og i nettleseren. Tidligere ble datoer formatert i UTC på serveren og i nettleserens lokale tidssone hos brukeren – noe som ga en uoverensstemmelse som utløste en React-feil (#418) og fikk siden til å bygge seg opp på nytt ved hver innlasting.

### Hva det betyr i praksis

Datoen ved «I dag» og tidspunktet øverst på siden er nå de samme uavhengig av hvilken tidssone datamaskinen eller telefonen er satt til, og React-feilen i konsollen er borte. Hvilke dager som telles med i periodene er uendret.

### Bakgrunn

Feilen ble oppdaget under feilsøking av et mulig problem med periodevalg («I dag» → «7 dager») i Safari på iOS. Selve iOS-problemet er ikke bekreftet løst, men dato-uoverensstemmelsen er nå rettet og kan ha vært en medvirkende årsak.

### Påvirkning

Kun intern bruk (`/stats`). Ingen endringer for besøkende på fyrk.no eller brukere av verktøyene.