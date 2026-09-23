---
title: "Avhengigheter oppdatert og CI kjørt på Node 22"
date: 2026-09-23
summary: "Alle verktøy på fyrk.no fungerer som før, men den tekniske plattformen er oppdatert og klar for kommende forbedringer."
tags: [internal]
audience: "internal"
draft: false
---

### Ingen synlige endringer for brukeren

Alle verktøyene på fyrk.no — OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg — ser og fungerer nøyaktig som før. Denne oppdateringen endrer ingenting i brukergrensesnittet.

### Hva som er gjort

Avhengigheter på minor- og patch-nivå er oppdatert (blant annet React 19.3, Playwright 1.63 og TypeScript ESLint 8.70). CI-miljøet er flyttet fra Node 20 til Node 22, som er et krav for Astro 7 — neste planlagte plattformoppgradering. To iCloud-duplikatfiler som lå utracket i repoet er fjernet og mønsteret er nå ignorert.

### Hvorfor det er viktig

Oppdateringen fjerner blokkeringer som sto i veien for videre arbeid. Node 22 i CI er nå verifisert, og `npm outdated` viser kun gjenstående major-versjoner — hver av dem sporet i en ny moderniseringsplan. Produksjonskoden er ikke rørt.

### Neste steg

En strukturert moderniseringsplan (`docs/modernization-plan.md`) er lagt inn i repoet. Den sekvenserer syv spor etter avhengighet, der økt testdekning av AI-laget og oppgradering av Astro 7 er de neste prioriteringene.