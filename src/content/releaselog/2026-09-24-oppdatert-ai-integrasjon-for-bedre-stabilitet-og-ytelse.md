---
title: "Oppdatert AI-integrasjon for bedre stabilitet og ytelse"
date: 2026-09-24
summary: "Anthropic SDK er oppdatert til versjon 0.127.0, noe som gir mer stabil AI-kommunikasjon i alle verktøyene på fyrk.no."
tags: [fix, perf, internal]
audience: "internal"
draft: false
---

### Hva er oppdatert

Biblioteket som håndterer kommunikasjonen mellom fyrk.no og Anthropic sitt AI-API er oppdatert fra versjon 0.120.0 til 0.127.0. Dette gjelder alle verktøyene: OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg.

### Stabilitetsforbedringer

Oppdateringen inkluderer flere feilrettinger som gjør AI-kallene mer pålitelige. Blant annet unngås nå feil gjenforsøk på forespørsler som ikke kan sendes på nytt, og feil håndtering av strømmede svar er rettet opp. Samlet sett reduserer dette risikoen for uventede feil i verktøyene.

### Ytelse

AI-klienten er optimalisert slik at den bruker mindre ressurser under normale driftsforhold. Dette kan gi noe raskere responstid for brukerne, særlig ved gjentatt bruk av verktøyene.

### Ingen endringer for brukerne

Oppdateringen er utelukkende teknisk. Funksjonalitet, grensesnitt og arbeidsflyt i verktøyene er uendret.