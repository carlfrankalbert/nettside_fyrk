---
title: "Besøkende telles nå én gang per dag på tvers av sider"
date: 2026-09-29
summary: "Telleren for besøkende på statistikksiden viser nå antall unike personer per dag, ikke summen av besøkende per side."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva var problemet?

Nøkkeltallet «Besøkende» i statistikkdashbordet skulle alltid telle hver person én gang per dag – slik verktøytipset beskriver. I stedet ble besøkende summert per side, slik at én person som leste fire sider ble telt som fire. På en konkret dag i produksjon viste telleren 6, mens det reelle tallet var 3.

### Hva er rettet?

Telleren slår nå sammen de daglige besøkende-listene for alle sider og teller hver person kun én gang. Endringen er korrekt for historiske data også – ingen data er gått tapt eller endret.

### Hva påvirkes?

Bare statistikksiden (`/stats`). Alle andre tall – sidevisninger og besøkende per enkeltside – er uendret. Endringen er synlig kun for interne brukere med tilgang til dashbordet.