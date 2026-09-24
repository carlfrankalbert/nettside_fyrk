---
title: "Statistikk for fyrk.no teller ikke lenger med intern testtrafikk"
date: 2026-09-24
summary: "Sidevisninger fra workers.dev og forhåndsvisnings-URLer telles ikke lenger i produksjonsstatistikken."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva endret seg

`/stats`-dashbordet viser nå kun trafikk fra fyrk.no. Forespørsler fra `*.workers.dev`-domener og branch-forhåndsvisninger filtreres bort før de skrives til analysedatabasen.

### Bakgrunn

Workers.dev-URLen og forhåndsvisnings-URLer deler analysedatabase med fyrk.no. Intern testing i forbindelse med en nylig utrulling førte til at antall registrerte sidevisninger ble kunstig høyt – for eksempel viste startsiden 14 visninger på én time mot normalt 1–3. Tallene fra den perioden er ikke rettet opp, men nye data vil være korrekte.

### Ingen effekt for besøkende

Endringen påvirker ikke fyrk.no for vanlige brukere. Det som telles, og hvordan siden fungerer, er uendret – kun filtreringen av intern testtrafikk er justert.

### Kvalitetssikring

Det er lagt til 8 nye automatiserte tester for ekskluderingslogikken, inkludert kontroll av URL-er som ligner på produksjons-URLer. Alle 614 enhetstester passerer.