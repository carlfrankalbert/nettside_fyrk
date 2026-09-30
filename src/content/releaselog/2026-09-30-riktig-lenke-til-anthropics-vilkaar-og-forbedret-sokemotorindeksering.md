---
title: "Riktig lenke til Anthropics vilkår og forbedret søkemotorindeksering"
date: 2026-09-30
summary: "Vilkårssiden lenker nå til riktige API-vilkår fra Anthropic, og feilsidene 404 og 500 er skjult fra søkemotorer."
tags: [fix]
audience: "user-facing"
draft: false
---

### Riktig lenke til Anthropics vilkår

På siden som beskriver FYRKs personvern og vilkår lenket vi tidligere til Anthropics forbrukervilkår. Siden FYRK bruker Claude via API, er det de kommersielle API-vilkårene som gjelder. Lenken peker nå til rett dokument.

### Feilsider vises ikke lenger i søkeresultater

Sidene som vises når noe går galt (404 – side ikke funnet, og 500 – serverfeil) er nå merket med `noindex`. Det betyr at søkemotorer ikke lenger forsøker å indeksere eller vise disse sidene i søkeresultater – noe de aldri burde ha gjort.

### Ingen synlige endringer for brukere

Alt ser ut som før. Endringene påvirker kun korrekthet i lenker og hvordan nettsiden presenterer seg for søkemotorer i bakgrunnen.