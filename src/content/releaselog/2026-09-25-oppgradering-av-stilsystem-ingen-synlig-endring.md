---
title: "Oppgradering av stilsystem – ingen synlig endring"
date: 2026-09-25
summary: "Tailwind CSS er oppgradert fra versjon 3 til 4 under panseret – nettstedet ser identisk ut som før."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble gjort

Det underliggende stilrammeverket (Tailwind CSS) er oppgradert fra versjon 3 til versjon 4. Endringen er usynlig for besøkende – alle sider på fyrk.no ser og oppfører seg nøyaktig som før.

### Hvorfor ingen synlig endring?

Tailwind 4 innfører nye standardverdier for farger, linjehøyder og andre visuelle egenskaper. Disse er nøytralisert slik at nettstedet beholder det etablerte uttrykket fra versjon 3. Alle 76 sider er sammenlignet visuelt mot den eksisterende løsningen og bekreftet identiske.

### Teknisk grunnlag

Oppgraderingen er del av den planlagte moderniseringen av kodebasen (modernization-plan.md, spor 5). Et oppdatert byggverktøy og færre avhengigheter gjør fremtidig vedlikehold enklere og reduserer risikoen for utdaterte pakker.

### Berørte verktøy

Alle verktøy på fyrk.no er inkludert: OKR-sjekken, Konseptspeilet, Antakelseskartet, Pre-Mortem Brief og Beslutningsloggen. Ingen funksjonalitet er endret.