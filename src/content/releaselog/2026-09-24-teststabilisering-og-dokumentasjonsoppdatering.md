---
title: "Teststabilisering og dokumentasjonsoppdatering"
date: 2026-09-24
summary: "Interne tester og testdokumentasjon er oppdatert for å reflektere gjeldende innhold og API-oppførsel på fyrk.no."
tags: [internal, docs]
audience: "internal"
draft: false
---

### Hva ble gjort

Tre testgrupper feilet på `main` av årsaker som ikke hadde med selve koden å gjøre. Testene er nå rettet opp slik at de stemmer med faktisk innhold og oppførsel på nettstedet.

### Visuelle baselines for Pixel 7

Skjermbildene som brukes som referanse i de visuelle testene var utdaterte etter at nettsidekopien ble oppdatert i en tidligere PR. Nye baselines er generert, og testene er igjen i sync med det brukerne faktisk ser.

### API- og sikkerhetstester

Testene for OKR-sjekken-API-et og sikkerhetslagene asserterte på gamle feilmeldinger og statuskoder som ikke lenger stemte med produksjonsoppførselen. Disse er oppdatert til å verifisere korrekte norske feilmeldinger og de statuskodene Astro faktisk returnerer.

### Testdokumentasjon

`docs/testing.md` er oppdatert med en note om at Playwright gjenbruker en eventuell server som allerede kjører på port 4321. Dette forhindrer forvirring dersom en gammel utviklingsserver er oppe og serverer utdatert innhold under lokale testkjøringer.