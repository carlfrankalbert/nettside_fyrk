---
title: "Fjernet ubrukt feilsporing fra Sentry"
date: 2026-09-25
summary: "Sentry-koden er fjernet fra fyrk.no fordi den aldri var i bruk og utgjorde en unødvendig personvernrisiko."
tags: [internal, security]
audience: "internal"
draft: false
---

### Hva ble endret

Sentry-integrasjonen er fjernet fra alle sider på fyrk.no. Det innebærer at én ekstra skriptfil (~330 linjer) ikke lenger lastes ned av nettleseren, og at ingen kode lenger kobler seg på `fetch` eller `console.error`.

### Hvorfor ble dette gjort

Sentry var aldri konfigurert og har aldri kjørt i produksjon. Hadde det blitt aktivert, ville det introdusert en tredjepart i personvernpolicyen som potensielt kunne fange opp tekst brukere skriver inn i verktøyene på fyrk.no — for eksempel i OKR-sjekken eller Antakelseskartet.

### Hva dekker feilovervåkingen nå

Serverfeil fanges opp av Cloudflare Workers Logs, og feil i AI-verktøyene telles per type og vises i `/stats`-dashbordet. Dekningen er tilsvarende som før, uten tredjepartsavhengighet.

### Påvirkning for brukere

Ingen synlig endring. Sidene er uendret, og ingen funksjonalitet er fjernet.