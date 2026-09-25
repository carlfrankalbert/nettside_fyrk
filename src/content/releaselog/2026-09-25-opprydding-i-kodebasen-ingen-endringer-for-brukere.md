---
title: "Opprydding i kodebasen – ingen endringer for brukere"
date: 2026-09-25
summary: "Intern opprydding av død kode, utdatert dokumentasjon og feilsporte byggfiler – ingen påvirkning på funksjonalitet eller brukeropplevelse."
tags: [internal]
audience: "internal"
draft: false
---

### Hva ble gjort

En gjennomgang av repoet avdekket flere filer og funksjoner som ikke lenger er i bruk: byggfiler som ved en feil var sporet i Git, en gammel `CNAME`-fil fra GitHub Pages, ubrukte eksporter og kode som aldri ble kalt i produksjon.

### Dokumentasjon oppdatert

Utviklerdokumentasjonen (`TESTMILJO.md`, `TESTING.md`, `CLAUDE.md` og agent-filene) beskrev utdaterte oppsett – blant annet GitHub Pages, Netlify og en `develop`-gren som ikke lenger eksisterer. Disse er nå oppdatert til å reflektere hvordan prosjektet faktisk bygges og testes med Cloudflare Workers-forhåndsvisninger.

### Ingen endring for brukere

Alle verktøyene på fyrk.no – OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg – fungerer nøyaktig som før. Oppryddingen påvirker ikke atferd, ytelse eller utseende.

### Kvalitetssikring

638 enhetstester, typesjekk, linting, bygg og ende-til-ende-røyktester er alle grønne etter endringene.