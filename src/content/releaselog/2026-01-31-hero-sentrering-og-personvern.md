---
title: "Hero-sentrering og personvernforbedringer"
date: 2026-01-31
summary: "Fikset sentrering av hero-seksjonen med flex-layout, hashet IP-adresser i rate limiter, og forbedret skjematilgjengelighet."
tags: ["fix", "a11y", "security"]
audience: "user-facing"
draft: false
---

## Hva er nytt

### Hero-sentrering fikset
Hero-seksjonen på forsiden bruker nå flex-layout for korrekt sentrering. Fjernet gammel spacer-hack og strammet inn container-bredden for bedre visuelt uttrykk.

### IP-adresser hashes i rate limiter
Rate limiteren hasher nå IP-adresser før lagring. Dette betyr at vi aldri lagrer faktiske IP-adresser — kun en enveis-hash som fortsatt lar oss begrense misbruk.

### Skjematilgjengelighet forbedret
Tomme feilmeldinger skjules nå med `empty:hidden`, slik at skjermlesere ikke leser opp usynlige tomme elementer. Bedre opplevelse for alle brukere.
