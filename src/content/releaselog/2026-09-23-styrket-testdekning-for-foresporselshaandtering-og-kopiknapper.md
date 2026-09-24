---
title: "Styrket testdekning for forespørselshåndtering og kopiknapper"
date: 2026-09-23
summary: "Ny testdekning for kritiske lag i fyrk.no sikrer at feil oppdages tidligere og at API-beskyttelsen fungerer som forventet."
tags: [internal]
audience: "internal"
draft: false
---

### Hva er endret

Testdekningen for `lib/` og `hooks/` er betydelig utvidet. Totalt er 66 nye tester lagt til, som bringer samlet dekning fra 51 % til 60 %. Ingen produksjonskode er endret i denne leveransen.

### Hvilke deler er dekket

De nye testene treffer koden som kjører *før* et Anthropic-kall sendes — validering av origin, innholdslengde, body-format og mock-modus. I tillegg dekkes nå `streaming-response`, `structured-logger`, `request-utils`, `debounce`, og kopikrokene `useCopyToClipboard` og `useCopyWithToast`.

`validate-origin`-testene inkluderer nærtreff som `notfyrk.no` og `fyrk.no.evil.example`, som begge avvises korrekt. Dette fester CSRF-beskyttelsen i regresjonstest slik at den ikke kan brytes stille.

### Hvorfor det betyr noe

Koden som nå er dekket er den som beskytter API-budsjettet og stopper misbruk. Når noe ryker i produksjon, er det gjerne her. Med terskler hevet til faktisk oppnådd nivå vil en fremtidig nedgang i dekning fanges opp automatisk i CI — ikke etter at koden er i produksjon.