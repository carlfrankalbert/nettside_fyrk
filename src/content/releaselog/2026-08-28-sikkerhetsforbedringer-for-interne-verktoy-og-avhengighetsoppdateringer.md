---
title: "Sikkerhetsforbedringer for interne verktøy og avhengighetsoppdateringer"
date: 2026-08-28
summary: "Interne tilgangskontroller er herdet mot tidsmålingsangrep, og kjente sikkerhetssårbarheter er redusert fra 31 til 5."
tags: [security, internal]
audience: "internal"
draft: false
---

### Hva er endret

Tilgangsbeskyttelsen for interne ruter (`/stats`, `/beta`, `/feature-toggles`, `/api/vitals`, `/api/feature-toggles`) er samlet i én felles hjelpefunksjon med konstant-tids-sammenligning. Tidligere var fire av fem porter sårbare for tidsmålingsangrep som potensielt kunne avsløre tokens. Nå er alle fem sikret likt.

### Sikkerhetsstatus

Kjente sårbarheter i avhengigheter er redusert fra 31 til 5. De gjenværende 5 krever en større Astro-oppgradering og håndteres i en egen PR.

### Ingen synlig endring for brukere

Verktøyene på fyrk.no – OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg – fungerer nøyaktig som før. Endringene berører kun intern infrastruktur.

### Vedlikehold

Ubrukt kode er fjernet, og designtokens er nå dokumentert og sporbare i repoet. Testdekningen er utvidet med 11 nye tester (totalt 526 bestått).