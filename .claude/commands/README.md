# FYRK Claude Code Commands

Slash commands for personas og orchestrated reviews.

Personas er "linser/instrumenter" (ikke kollegaer) som identifiserer risiko uten å foreslå løsninger.

## Fremgangsmåte

1. **Før koding:** `/review-concept` - vurder konsept/copy/flow
2. **Etter koding:** `/review-change` - vurder diff/implementasjon
3. **Før merge:** `/review-release` - gate basert på forrige review

## Orchestrated Reviews

```
/review-concept Mål: ... Constraints: stateless ... Endring: ...
/review-change Review diff: ... (eller "Se på filene X/Y")
/review-release
```

Output: UX → QA → FE → BE → Data → Legal → FYRK Quality → TRIAGE → DECISION

## Enkelt-personas

Kjør én linse om gangen:

```
/personas/ux <tekst>
/personas/qa <tekst>
/personas/frontend <tekst>
/personas/backend <tekst>
/personas/data <tekst>
/personas/legal <tekst>
/personas/fyrk-quality <tekst>
/personas/triage
/personas/go-no-go
```

## Tips

- Inkludér alltid mål/scope/constraints for å unngå generiske svar
- Maks 5 risikopunkter per seksjon, ingen løsninger
- Bruk `/review-release` etter en full review for rask GO/NO-GO
