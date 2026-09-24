---
title: "CI-dekning gjenopprettet og grunnarbeid for Astro 7"
date: 2026-09-23
summary: "Sikkerhetsskanning brøt all testdekning på pull requests — nå kjører den separat slik at kodesjekker alltid gjennomføres."
tags: [fix, internal, security, docs]
audience: "internal"
draft: false
---

### Hva skjedde

En kjent sårbarhet i Astro-pakken fikk CI til å avbryte seg selv før noen tester kjørte. Bygget ble rapportert rødt, men ikke fordi noe var galt med koden — all testdekning ble i praksis hoppet over på hver eneste pull request.

### Hva er endret

Sikkerhetsskanningen kjører nå som en egen jobb og stopper ikke lenger bygg, enhetstester, ende-til-ende-tester eller tilgjengelighetstester. Den er fortsatt synlig i CI-oversikten. De to aksepterte sårbarhetene er dokumentert i `docs/security/dependency-audit.md` med begrunnelse for hvorfor de ikke utgjør en reell risiko for dette nettstedet.

### Forberedelser for Astro 7

Innholdssamlingene og Tailwind-oppsettet er justert i henhold til krav som Astro 7 stiller. Endringene er bakoverkompatible med gjeldende versjon, og URL-er samt nøkler for artikkelstatistikk er uendret. Selve oppgraderingen til Astro 7 — som krever en hostingmigrering — tas som en egen sak.

### Synlig effekt for brukere

Ingen. Nettsidene, verktøyene og innholdet er uendret.