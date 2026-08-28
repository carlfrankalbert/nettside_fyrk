---
title: "Oppgradering til React 19"
date: 2026-08-28
summary: "Fyrk.no kjører nå på React 19, uten synlige endringer for brukerne."
tags: [internal]
audience: "technical"
draft: false
---

### Hva er endret

Det underliggende React-rammeverket er oppgradert fra versjon 18 til versjon 19. Endringen berører alle verktøyene på fyrk.no: OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg.

### Hva dette betyr for deg som bruker

Ingenting å merke seg. Sidene ser like ut, oppfører seg likt, og alle funksjoner fungerer som før. Oppgraderingen er et vedlikeholdsløft under panseret.

### Hvorfor ble dette gjort

React 18 var den siste større avhengigheten som holdt nettstedet på en utdatert versjon av rammeverket. Ved å gå til React 19 sikrer vi at fyrk.no følger med på støttede versjoner og kan dra nytte av fremtidige forbedringer og sikkerhetsoppdateringer.

### Kvalitetssikring

Alle 526 enhetstester passerer, og bygget er validert med typesjekk, automatiserte ende-til-ende-tester og tilgjengelighetskontroller før utrulling.