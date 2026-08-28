---
title: "Fikset uendelig løkke i automatisk generering av release-notater"
date: 2026-08-28
summary: "CI-arbeidsflyten som lager release-notater vil ikke lenger spinne opp en endeløs kjede av pull requests mot seg selv."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva skjedde

Automatikken som genererer release-notater kjørte etter hver merge til `main` – inkludert når det som ble merget *var* et release-notat-PR. Det skapte en selvforsterkende kjede: PR #149 genererte #151, som ville ha generert enda et nytt, og så videre.

### Hva er fikset

Arbeidsflyten hopper nå over release-notat-generering når den detekterer at den mergede grenen selv er en release-notes-gren. Vanlige feature-PRer og bugfikser får fortsatt release-notater som normalt.

### Påvirkning for brukere

Ingen. Dette er utelukkende en intern CI-endring og påvirker ikke funksjonaliteten på fyrk.no.