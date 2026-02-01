# FYRK Claude Code Commands

Slash commands for review av konsepter, endringer og releases.

## Fremgangsmåte

1. **Før koding:** `/review-concept` — vurder konsept/copy/flow
2. **Etter koding:** `/review-change` — vurder diff/implementasjon
3. **Før merge:** `/review-release` — GO/NO-GO gate

## Bruk

```
/review-concept Mål: ... Endring: ...
/review-change Se på filene X/Y (eller diff)
/review-release
```

Alle kommandoer gir én samlet tverrfaglig vurdering (UX, QA, tech, produkt, juss, data) uten separate personas. Output er beslutningsklart.
