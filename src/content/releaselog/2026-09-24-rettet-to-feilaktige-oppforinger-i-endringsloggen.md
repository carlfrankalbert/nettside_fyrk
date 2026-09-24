---
title: "Rettet to feilaktige oppføringer i endringsloggen"
date: 2026-09-24
summary: "To oppføringer i endringsloggen på fyrk.no/releaselog er korrigert slik at de beskriver faktiske hendelser korrekt."
tags: [fix, docs, internal]
audience: "internal"
draft: false
---

### Hva ble rettet

To tidligere publiserte endringslogg-oppføringer inneholdt faktafeil som nå er korrigert:

- **Driftsguider for GitHub Pages og Domeneshop:** Oppføringen sa at GitHub Pages ble faset ut i november 2025. Det stemmer ikke – november 2025 var da guidene ble skrevet. GitHub Pages ble faktisk avviklet i august 2026, og fyrk.no flyttet til Workers i september 2026.
- **Testdekning for skjemahooks:** Oppføringen sa at alle skjemahooks nå er fullt testet. Det stemmer ikke – `useStreamingForm` er fortsatt uten testdekning.

### Hvorfor det ble feil

En automatisert bot genererte begge oppføringene før de ble kvalitetssikret, og feilene ble ikke fanget opp før publisering.

### Konsekvens for brukere

Endringsloggen er et internt dokument, men korrekthet er viktig. Det er ingen funksjonelle endringer – kun innhold i endringsloggen er oppdatert.