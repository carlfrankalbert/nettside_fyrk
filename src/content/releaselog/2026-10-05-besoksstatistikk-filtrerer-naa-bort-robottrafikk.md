---
title: "Besøksstatistikk filtrerer nå bort robottrafikk"
date: 2026-10-05
summary: "Besøkstallene på /stats er nå mer realistiske fordi automatiserte roboter og datasenternett filtreres bort før de telles."
tags: [fix, internal]
audience: "internal"
draft: false
---

### Hva var problemet?

Besøkstallene på `/stats` var sterkt forvrengt av robottrafikk. Den 5. oktober 2026 var 17 av 18 registrerte «besøkende» i realiteten automatiserte crawlere – én gikk systematisk gjennom alle offentlige sider i løpet av én time, mens tre andre kom fra kjente datasentertjenester.

### Hva er endret?

To filtre er lagt til:

- **Nettverksfilter (server):** Forespørsler fra kjente datasentre, skyplattformer og VPN-nett avvises før de telles. Vanlige forbrukernett som Google Fiber slippes gjennom som normalt.
- **Synlighetstid (klient):** Et sidebesøk registreres først etter at siden har vært synlig i 5 sekunder sammenhengende. 404-siden er unntatt og teller fremdeles umiddelbart.

Begge filtrene gjelder også klikk-sporing via `/api/track`.

### Hva betyr dette i praksis?

Besøkstallene vil falle – det er tilsiktet. Tallene gjenspeiler nå reell menneskelig aktivitet bedre enn før. Merk at reelle besøkende som forlater en side under 5 sekunder heller ikke telles lenger, og personer på store bedriftsnett (for eksempel Microsoft-ansatte) kan bli filtrert bort. Begge disse avveiningene er akseptable gitt formålet med statistikken.

### Hva bør følges opp?

Kontroller D1-dataene etter noen dager for å bekrefte at filtreringen fungerer som forventet, og at ikke legitime besøkende utilsiktet filtreres bort.