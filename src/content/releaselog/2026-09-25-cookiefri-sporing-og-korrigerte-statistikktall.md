---
title: "Cookiefri sporing og korrigerte statistikktall"
date: 2026-09-25
summary: "Analysesporing på fyrk.no lagrer ikke lenger noe i nettleseren, og statistikken i dashbordet er nå korrekt."
tags: [fix, security, internal]
audience: "internal"
draft: false
---

### Ingen lagring i nettleseren

Sporingen brukte tidligere en sesjons-ID i `localStorage` for å telle unike besøk. Dette er ikke-nødvendig enhetslagring og krever samtykke etter ekomloven § 3-15. Sesjons-IDen er fjernet. Sporing skjer nå utelukkende server-side, uten informasjonskapsler eller lokal lagring.

### Korrigerte tall i statistikkdashbordet

Flere feil førte til at tallene i `/stats` var feil:

- **OKR-fullføringer stod på 0** fordi klienten sendte `okr_success`, men dashbordet leste `check_success`.
- **OKR-trakten var oppblåst** fordi ukjente hendelses-IDer ble feilregistrert som `okr_submit`. Ti manglende IDer er lagt til, og ukjente IDer gir nå feilmelding i stedet for å bli telt feil.
- **Unike sesjoner viste ~1 per dag** på grunn av en feil i dedupliseringslogikken. Unike besøkende telles nå korrekt per dag, server-side.

Eksisterende tall for `okr_submit` og «Unike sesjoner» vil skifte etter utrulling — dette er forventet og ønsket.

### Sikrere besøkshash

Tidligere ble besøkende identifisert med en usaltet SHA-256-hash av IP-adresse og dato, som i prinsippet kan brytes med brute force. Hashen saltes nå med en tilfeldig daglig salt som roteres og slettes etter to dager. IP-adresser lagres aldri.

### Sporingsdekning er utvidet og forenklet

CTA-knapper i headeren ble ikke sporet på andre sider enn forsiden. Sporingen er nå samlet på ett sted og dekker alle sider konsistent, inkludert verktøysidene. Personvernsiden er oppdatert til å beskrive det som faktisk samles inn.