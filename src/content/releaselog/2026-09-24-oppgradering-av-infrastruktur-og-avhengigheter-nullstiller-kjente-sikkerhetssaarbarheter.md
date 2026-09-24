---
title: "Oppgradering av infrastruktur og avhengigheter – nullstiller kjente sikkerhetssårbarheter"
date: 2026-09-24
summary: "Fyrk.no er oppgradert til Astro 7 og flyttet til Cloudflare Workers, uten endringer for brukerne – men med to kritiske sikkerhetssårbarheter lukket."
tags: [security, internal]
audience: "internal"
draft: false
---

### Ingen endring for brukerne

Alle sider, verktøy og URL-er er som før. OKR-sjekken, Konseptspeilet, Antakelseskart, Pre-Mortem Brief og Beslutningslogg fungerer uendret.

### To kritiske sikkerhetssårbarheter er lukket

Oppgraderingen lukker to aksepterte sårbarheter som lå i avhengighetsloggen:

- **Astro RCE via AVIF-behandling** (GHSA-26w7-cxv4-gfx2, CVSS 9,8) – en sårbarhet som i teorien kunne tillate kjøring av vilkårlig kode ved bildebehandling
- **sharp/libvips** – tilhørende sårbarhet i bildebiblioteket

`npm audit` rapporterer nå 0 sårbarheter.

### Plattformflytting fra Pages til Workers

Astro 7 krever Cloudflare Workers som kjøretidsmiljø. Overgangen er gjennomført uten nedetid: domenet ble først bekreftet på Workers, deretter flyttet fra Pages. Pages-prosjektet beholdes en periode som fallback.

En mindre kjent endring: hemmelige nøkler leses ikke lenger fra byggeprosessen, noe som lukker en mulighet for at en API-nøkkel utilsiktet kunne blitt bakt inn i serverbunten ved lokalt bygg.

### Teknisk gjeld og dokumentasjon

Oppgraderingen er del av moderniseringsplanen (spor 4). Rutinedokumentasjon for deploy, overvåking og sikkerhetsrevisjon er oppdatert til å gjenspeile den nye infrastrukturen.