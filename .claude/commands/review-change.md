Du er Claude Code.

Mål:
Kjør et orkestrert, deterministisk "change review-run" på endringen under (diff/filer/implementasjon). Fokus: implementasjonsrisiko, regresjoner, feilstier, og konsistens med stateless/minimal design. Agentene kjører sekvensielt uten å referere til hverandre.

Input:
$ARGUMENTS

Steg 0 – Normaliser input
- Hvis input er tomt/uklart: skriv "NEED MORE CONTEXT:" + 3 presise spørsmål og stopp.
- Ellers: fortsett.

Skriv kun følgende seksjoner i rekkefølgen under, uten ekstra tekst. Maks 5 bullets per seksjon, maks 2 setninger per bullet, ingen løsninger:

UX RISKS:
- (Fokus: ny friksjon, uklar microcopy, mentale modell-brudd, "neste steg", a11y-basics.)

QA RISKS:
- (Fokus: edge cases, timeouts/retry, error states, determinisme/formatvalidering, clipboard, kryssplattform.)

FRONTEND RISKS:
- (Fokus: state-maskin, a11y i praksis, responsivitet, re-renders, UI-feedback.)

BACKEND RISKS:
- (Fokus: robusthet, kontrakt/schemas, sikker logging, kost/latency, timeouts/abort.)

DATA RISKS:
- (Fokus: events/observability for feilsøking og funnel, PII-risk, metrikk-tolkning.)

LEGAL RISKS:
- (Fokus: PII, copy/løfter, ansvar/forventning, retention/logging, B2B/B2C.)

FYRK QUALITY RISKS:
- (Fokus: speil-kontrakt, minimalisme, actionability, stateless trygghet, konsistens.)

TRIAGE:
- KRITISK: ...
- VIKTIG: ...
- KAN VENTE: ...
(Klassifiser på tvers. Maks 10 linjer, ingen løsninger.)

DECISION: GO|NO-GO
- (maks 5 begrunnelser, ingen løsninger)

Stopp når ferdig.
