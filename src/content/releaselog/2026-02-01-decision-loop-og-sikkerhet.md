---
title: "Decision Loop og sikkerhetsforbedringer"
date: 2026-02-01
summary: "Ny Decision Loop-app for daglig beslutningsjournal, herdet API-sikkerhet, og forbedret verktøysider."
tags: ["feature", "security"]
audience: "user-facing"
draft: false
---

## Hva er nytt

### Decision Loop — daglig beslutningsjournal

Ny app for å ta bedre beslutninger, én dag om gangen. Du logger dagens viktigste beslutning, klargjør problemet, og låser beslutningen når du er klar. Låste beslutninger kan deles og eksporteres til Markdown.

- **Daglig visning** med autosave mens du skriver
- **Lås-flyt** som gjør beslutningen uforanderlig
- **Beslutningslogg** for oversikt over tidligere beslutninger
- **Deling** via unik lenke (ingen innlogging for mottaker)
- **Markdown-eksport** for arkivering

### Herdet API-sikkerhet

Alle API-endepunkter har fått strengere inputvalidering og forbedret PII-deteksjon. Dette beskytter mot uønsket datalekkasje og styrker tilliten til verktøyene.

### Forbedrede verktøysider

Fordel-seksjonene på verktøysidene (OKR-sjekken, Konseptspeilet, m.fl.) er konsolidert til delte komponenter. Mer konsistent visuelt uttrykk og enklere vedlikehold.
