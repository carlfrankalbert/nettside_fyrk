---
title: "Interne tokens forsvinner fra adressefeltet etter første besøk"
date: 2026-09-24
summary: "Tokens for interne sider lagres nå som sikre informasjonskapsler, slik at de ikke lenger vises i adressefeltet, nettleserloggen eller serverlogger."
tags: [security, internal]
audience: "internal"
draft: false
---

### Hva er endret

Sidene `/stats`, `/feature-toggles` og `/beta` brukte tidligere `?token=` i URL-en ved hvert besøk. Nå blir tokenet byttet mot en sikker informasjonskapsel ved første forespørsel, og siden lastes på nytt uten token i adressen.

### Hvorfor det er viktig

En token i URL-en havner automatisk i nettleserens historikk, autofullføring og serverlogger. Det øker risikoen for utilsiktet eksponering. Informasjonskapsler satt med `HttpOnly`, `Secure` og `SameSite=Lax` er ikke tilgjengelige for JavaScript og sendes ikke til fremmede domener.

### Praktisk for deg som bruker sidene

Koblingene og tilgangen fungerer som før – du trenger ikke gjøre noe nytt. Eneste unntak: en `/feature-toggles`-fane som var åpen før utrullingen må lastes på nytt med `?token=` én gang før innstillinger kan lagres.

### Ingen endring for vanlige besøkende

Dette påvirker kun interne administrasjonssider. Fyrk.no fungerer uendret for alle andre.