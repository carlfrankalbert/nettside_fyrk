# OKR-sjekken

## Purpose

AI-powered review tool that evaluates user-submitted OKRs against best practices. Uses Anthropic Claude to provide structured feedback on objectives and key results.

## UX

- User enters OKR text in a form (`/okr-sjekken`)
- Submits for AI analysis (streaming response)
- Receives structured feedback with scores and suggestions
- Can copy results to clipboard

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/okr-sjekken` | Page | Main tool UI |
| `/api/okr-sjekken` | API | Streaming AI endpoint |

## Key files

- `src/pages/okr-sjekken.astro` — page
- `src/pages/api/okr-sjekken.ts` — API route
- `src/services/okr-service.ts` — business logic
- `src/utils/okr-parser.ts` — response parser
- `src/hooks/useStreamingForm.ts` — shared streaming hook

## Config

| Env var | Required | Description |
|---------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (prod) | Anthropic API key |
| `ANTHROPIC_MODEL` | No | Override default model |

## Edge cases

- Empty input: client-side validation prevents submission
- API timeout: `StreamingError` component shows retry option
- Rate limiting: handled at API level

## Telemetry

- No PII logged
- Error tracking via Sentry (if `PUBLIC_SENTRY_DSN` set)
