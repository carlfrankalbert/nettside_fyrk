---
title: "Analytikk lagres nå utelukkende i D1"
date: 2026-09-30
summary: "Parallellskriving av statistikk til KV er fjernet – D1 er nå eneste datakilde for analytikk på fyrk.no."
tags: [internal]
audience: "internal"
draft: false
---

### Hva er endret

All skriving av sidevisninger og klikk går nå kun til D1. Den midlertidige løsningen hvor data ble skrevet til både KV og D1 samtidig er avviklet. Statistikkdashbordet har lest fra D1 siden forrige oppdatering, så ingenting endrer seg i det du ser.

### Hvorfor

Dette er det siste steget i migreringen fra KV til D1 som analysedatabase. KV-koden er nå fjernet helt, noe som forenkler systemet betydelig (over 1 400 linjer slettet).

### Hva dette betyr i praksis

Ingen endring for brukere av verktøyene eller statistikksidene. Internt er systemet enklere: én datakilde, ingen synkronisering mellom lagre. En feil mot D1 vil nå gi en tydelig feilmelding (500) i stedet for å stilne bli logget.

### Tilbakestilling

Eventuelle gamle KV-nøkler slettes ikke aktivt – de utløper av seg selv. Ved behov kan denne endringen rulles tilbake ved å revertere PR-en.