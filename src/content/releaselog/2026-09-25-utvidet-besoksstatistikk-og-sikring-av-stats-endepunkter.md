---
title: "Utvidet besøksstatistikk og sikring av stats-endepunkter"
date: 2026-09-25
summary: "Statistikkdashbordet viser nå land, organisasjon, enhet og nettleser for besøkende, og API-endepunktene for statistikk er sikret med påkrevd autentisering."
tags: [feature, security, internal]
audience: "internal"
draft: false
---

### Nytt «Publikum»-panel i statistikkdashbordet

`/stats` har fått en ny seksjon som viser hvilke land, nettverksorganisasjoner, enheter og nettlesere besøkende kommer fra, samt hvilke stier som har gitt 404-feil. Dataene leses serversiden og er ikke tilgjengelig via noe åpent API. Alt telles én gang per unik besøkende per dag og lagres kun som summer – ingen informasjonskapsler eller enhetslagring brukes.

### Personvern uten samtykkebanner

De nye dimensjonene hentes fra selve forespørselen (Cloudflares metadata og User-Agent-headeren) og krever ikke samtykke fra brukeren. Personvernsiden (`/personvern`) er oppdatert med en beskrivelse av hvilke data som samles inn, hvor de kommer fra, og hvordan besøkende kan reservere seg.

### Sikkerhetsfiks: statistikk-API krever nå autentisering

`GET /api/pageview` og `GET /api/track` var tidligere offentlig tilgjengelige. `GET /api/vitals` var åpen når ingen token var konfigurert. Alle tre endepunkter krever nå et gyldig Bearer-token eller innloggingsinformasjonskapselen fra `/stats`. Eksisterende innlogginger på dashbordet fortsetter å fungere uten at noe må gjøres på nytt.

### Feilsider og sporingspålitelighet

404-sider sender nå stien til statistikken før de videresender brukeren. Tidligere kunne meta-refresh navigere bort før sporingsskriptet rakk å kjøre; nå brukes JavaScript-omdirigering umiddelbart, med meta-refresh som tre-sekunders reserve for besøkende uten JavaScript. I tillegg bruker alle sporingsforespørsler nå `keepalive`, slik at klikk på lenker som fører brukeren bort fra siden ikke lenger risikerer å avbryte statistikkregistreringen.