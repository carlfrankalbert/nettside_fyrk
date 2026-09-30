---
title: "AS-nummer og datasenter-merke i nettverkslisten på stats-siden"
date: 2026-09-28
summary: "Hvert nettverk i statistikk-dashbordet viser nå AS-nummer med lenke til bgp.tools, og kjente datasenter-nettverk får et eget merke."
tags: [feature, internal]
audience: "internal"
draft: false
---

### Hva er nytt

I nettverkslisten på `/stats` viser hvert nettverk nå sitt AS-nummer som en klikkbar lenke til bgp.tools. Der kan du raskt se hvem som eier nettverket og hvilken type det er. Nettverk som tilhører skyplattformer eller datasentre får i tillegg et «datasenter»-merke.

### Hvorfor er dette nyttig

Nettverksnavn alene – som «Private Customer» – sier lite om hvem en besøkende faktisk er. AS-nummeret gjør det enkelt å slå opp nettverket og vurdere om trafikken er reell. Datasenter-merket er en påminnelse om at besøk fra slike nettverk nesten alltid er robottrafikk, ikke ekte brukere.

### Hva du bør vite

AS-nummeret vises kun for besøk registrert etter denne oppdateringen. Eldre data vises fortsatt korrekt, bare uten AS-nummer. Datasenter-merket utledes fra nettverksnavnet og kan i sjeldne tilfeller være unøyaktig.

### Personvern

Ingen nye besøksdata lagres. AS-nummeret tilhører nettverket, ikke den individuelle besøkende. By og sider per nettverk er bevisst utelatt for å unngå at enkeltpersoner kan identifiseres.