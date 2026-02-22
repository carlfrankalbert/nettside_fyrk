---
title: "Claude AI-kodeassistent integrert i GitHub"
date: 2026-02-22
summary: "Vi har lagt til Claude Code som kan hjelpe med kodereview, feilretting og utvikling direkte i GitHub."
tags: [feature, internal]
audience: "technical"
draft: false
---

## Ny AI-kodeassistent tilgjengelig

Vi har integrert Claude Code i vårt GitHub-repository. Claude er en AI-assistent som kan hjelpe med kodereview, feilretting, dokumentasjon og implementering av nye funksjoner.

## Slik bruker du Claude

Nevn `@claude` i en kommentar på pull requests eller issues for å aktivere assistenten. Claude vil analysere konteksten og utføre forespørselen automatisk gjennom GitHub Actions.

## Sikkerhet og tilgang

Kun brukere med skrivetilgang til repositoryet kan utløse Claude-workflowen. API-nøkler er sikkert lagret som GitHub Actions-hemmeligheter, og alle kjøringer logges i GitHub Actions-historikken.

## Kom i gang

Prøv å nevne `@claude` i en kommentar på din neste pull request for å teste den nye funksjonaliteten!