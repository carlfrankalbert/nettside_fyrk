---
title: "www.fyrk.no er tilbake og fungerer igjen"
date: 2026-09-24
summary: "Adressen www.fyrk.no sluttet å virke etter en domeneflytt – dette er nå rettet."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva skjedde

Da fyrk.no ble flyttet fra Cloudflare Pages til en Worker, ble DNS-oppføringen for `www.fyrk.no` aldri opprettet automatisk. Det førte til at besøkende som brukte `www`-adressen ikke kom frem til siden.

### Hva er fikset

`www.fyrk.no` er nå erklært som et eget domene direkte i konfigurasjonsfilen for workeren. Det betyr at riktig DNS-oppføring og SSL-sertifikat opprettes automatisk ved hver utrulling, og ikke lenger er avhengig av manuelle steg i dashbordet.

### Effekt for brukerne

Besøkende som skriver `www.fyrk.no` i nettleseren kommer nå frem til siden som normalt. Ingen endringer i funksjonalitet eller innhold.

### Risiko og stabilitet

Endringen påvirker ikke `fyrk.no` (uten `www`), som fungerte som før. Risikoen ved endringen er vurdert som lav.