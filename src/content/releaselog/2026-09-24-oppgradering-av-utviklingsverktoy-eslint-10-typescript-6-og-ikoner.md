---
title: "Oppgradering av utviklingsverktøy: ESLint 10, TypeScript 6 og ikoner"
date: 2026-09-24
summary: "Interne utviklingsverktøy er oppgradert til nyere versjoner uten endringer for brukerne."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble endret

ESLint er oppgradert fra versjon 9 til 10, TypeScript fra 5.9 til 6.0, lint-staged fra 16 til 17, og ikonbiblioteket lucide-react fra 0.563 til 1.48. Dette er del av FYRKs løpende moderniseringsplan for teknisk infrastruktur.

### Påvirkning for brukere

Ingen. Alle 26 ikoner som brukes på verktøysidene (OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief, Beslutningslogg) og på `/stats` er bekreftet uendret etter oppgraderingen.

### Kvalitetssikring

Typekontroll, linting og 638 enhetstester er gjennomført uten feil. Visuelle regresjonstester er kjørt for å bekrefte at ikoner og layout ser identiske ut som før.

### Tekniske justeringer

TypeScript 6 sin innebygde DOM-definisjon for `PerformanceEventTiming` erstattet vår egendefinerte kopi. ESLints nye regel `no-useless-assignment` avdekket fire startverdier som alltid ble overskrevet før bruk — de er fjernet.