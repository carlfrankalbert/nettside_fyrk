---
title: "Testdekning utvidet for skjemahooks i AI-verktøyene"
date: 2026-09-24
summary: "Alle skjemahooks bak AI-verktøyene er nå fullstendig testet, noe som styrker stabiliteten i fremtidige oppdateringer."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble gjort

Automatiserte tester er lagt til for de tre siste utestede hooks som håndterer skjemainput i AI-verktøyene på fyrk.no: `useFormInputHandlers`, `usePreMortemForm` og `useMobileSync`. Til sammen dekker de 24 nye testtilfeller.

### Hva testene dekker

Testene verifiserer blant annet tastatursnarvei for innsending (Cmd/Ctrl+Enter), URL-dekoding av input ved liming, automatisk tekstfeltstørrelse, validering av påkrevde felter (inkludert felter med bare mellomrom), serialisering, tilbakestilling av skjema og mobil CTA-tilstand under strømming.

### Effekt for brukere

Ingen direkte endringer. Verktøyene fungerer som før – testene sikrer at fremtidige endringer ikke bryter eksisterende oppførsel.

### Testdekning

Dekningsgrensene er hevet til faktisk oppnådd nivå: hooks-dekning økte fra 21 % til 54 %, og samlet linjedekning gikk fra 60 % til 65 %.