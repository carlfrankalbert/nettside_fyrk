# Contributing to FYRK

## Getting started

1. `cp .env.example .env` and add your keys
2. `npm install`
3. `npm run dev`

See `QUICKSTART.md` for full setup.

---

## Documentation Update Rules

### When docs MUST be updated

| Change type | Update required |
|-------------|----------------|
| New user-facing feature, behavior change, removal, rename | Feature doc + relevant sections |
| New route/page/tool, or changes to IA/navigation | Feature doc + `docs/README.md` if structure changes |
| New env var, config flag, secret, or integration | `CLAUDE.md` env table + `.env.example` |
| New background job/cron, webhook, or scheduled automation | Routine doc in `docs/routines/` |
| New operational routine (release, deploy, rollback, incident, migration) | Routine doc in `docs/routines/` |
| Change to API contracts, data models, validation rules | Relevant feature doc |
| Change affecting accessibility, performance budgets, SEO | Relevant design/feature doc |

### What must be updated (minimum)

**For a feature:**
- Feature doc in `docs/features/` (create if new)
- Quickstart/setup if it affects usage
- Screenshots/examples if UI changed

**For a routine:**
- Routine doc in `docs/routines/` (create if new)
- Automation references (workflow name, script name, required secrets)

See `docs/README.md` for file naming and required sections.

### Definition of done

A PR is not done unless at least one is true:
- Docs updated (with linked files in PR description), OR
- Docs explicitly not needed (with justification in PR description using `DOCS-NOT-NEEDED: <reason>`)

Reviewers should request docs if the Doc Impact checklist indicates impact.

---

## Doc Impact Checklist

Every PR must include this checklist (it's in the PR template):

- [ ] User-facing behavior changed
- [ ] New/changed routes/pages/tools
- [ ] New/changed env vars or secrets
- [ ] Ops routine introduced/changed (deploy/release/migration/etc.)
- [ ] API/data contract changed
- [ ] None of the above (explain briefly)

---

## Commit Message Guidelines

### Format

```
<scope>: <imperative summary>
```

Scopes: `feat`, `fix`, `perf`, `security`, `docs`, `chore`, `test`, `tools`

### Body (for non-trivial changes)

```
Why: <1-2 bullets>
User impact: <what changes for the user>
Doc impact: <files to update, or "none">
```

### Example

```
tools: add pre-mortem export to pdf

Why: users need offline copies for workshops
User impact: new "Export PDF" button on pre-mortem results
Doc impact: docs/features/pre-mortem.md
```

If a change introduces a new routine, use `routine:` in scope or add the `ops` label.

---

## Code standards

See `CLAUDE.md` for:
- TypeScript & architecture standards
- Testing strategy and commands
- API patterns
- Security guidelines
- Design & Architecture Contract
