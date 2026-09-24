---
title: "Oppdatert verktøy for automatiske release notes"
date: 2026-09-24
summary: "Anthropic SDK er oppdatert fra 0.120.0 til 0.127.0 i skriptet som lager release notes. Verktøyene på fyrk.no er ikke berørt."
tags: [internal]
audience: "internal"
draft: false
---

### Hva er oppdatert

Anthropic SDK er oppdatert fra versjon 0.120.0 til 0.127.0. SDK-en brukes bare i byggeskriptet som genererer release notes etter hver endring, ikke i verktøyene på nettstedet.

### Ingen endringer for brukerne

OKR-sjekken, Konseptspeilet, Antakelseskart og Pre-Mortem Brief kaller AI-API-et direkte og bruker ikke denne SDK-en. Funksjonalitet, grensesnitt og ytelse i verktøyene er uendret.
