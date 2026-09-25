---
title: "Fjernet ubrukt SLO-monitor fra AI-verktøyene"
date: 2026-09-25
summary: "Intern overvåkingskode som samlet data ingen leste er fjernet fra alle AI-verktøy på fyrk.no."
tags: [perf, internal]
audience: "internal"
draft: false
---

### Hva ble endret

En intern SLO-monitor (`slo-monitoring.ts`) som kjørte i bakgrunnen av alle AI-verktøy – OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg – er fjernet. Monitoren skrev aggregerte nøkkeltall til lagring hver time, men ingen del av systemet leste dem.

### Hvorfor det ikke hadde noen effekt på brukerne

Data fra monitoren ble aldri vist noe sted – verken i statistikk-visningen eller helsesjekker. Det brukerne ser er uendret, og all annen logging av forespørsler og rate-limit-hendelser fortsetter som før.

### Hva dette betyr internt

Fjerningen kutter unødvendige lese- og skriveoperasjoner mot KV-lagring ved hver kjøring. Eksisterende nøkler med `slo:`-prefiks utløper av seg selv innen 24 timer. Logging av faktiske hendelser – varigheter, utfall og rate-limit-treff – er upåvirket og ligger fortsatt til grunn for `/stats`.

### Risiko

Lav. Ingen testdekning gikk tapt fordi koden ikke hadde tester. Typesjekk, lint og 638 enhetstester er grønne.