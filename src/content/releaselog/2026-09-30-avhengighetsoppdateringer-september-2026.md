---
title: "Avhengighetsoppdateringer – september 2026"
date: 2026-09-30
summary: "Interne biblioteker er oppdatert for å holde plattformen stabil og sikker – ingen endringer for brukerne."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble oppdatert

Testverktøyet Vitest er oppgradert fra versjon 4 til versjon 5, og Anthropic SDK (brukt internt av releasenotat-skriptet) er oppdatert til 0.129. I tillegg er en rekke pakker oppdatert innenfor eksisterende versjonsområder, inkludert Astro, Wrangler og Lucide React.

### Påvirkning for brukere

Ingen. Alle verktøyene på fyrk.no – OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg – fungerer som før.

### Kvalitetssikring

665 enhetstester kjører rent på Vitest 5 med uendrede dekningsgrenser. Typesjekk, linting, bygg og `npm audit` er alle uten feil eller sårbarheter.