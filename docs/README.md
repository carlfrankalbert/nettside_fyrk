# Documentation — FYRK

## How to use this system

1. **Before coding:** check if your change requires a doc update (see `CONTRIBUTING.md`)
2. **While coding:** update docs in the same PR as code changes
3. **In the PR:** fill out the Doc Impact checklist in the PR template
4. **CI enforces:** the docs-gate workflow fails if code changed but no docs updated (bypass with `DOCS-NOT-NEEDED: <reason>` in PR body)

---

## Structure

```
docs/
  features/        Feature docs (one per tool/area)
  routines/        Operational runbooks (deploy, rollback, migrations, etc.)
  deployment/      Hosting, DNS, domain setup
  development/     Dev workflow, branches, testing, monitoring
  design/          Design principles, contrast, WCAG
  security/        Security testing docs
```

### Features (`docs/features/`)

One file per tool or feature area. Required sections:

| Section | Description |
|---------|-------------|
| Purpose | What it does and why |
| UX | User flow summary |
| Routes | Pages and API endpoints |
| Key files | Source files involved |
| Config | Env vars, flags, secrets |
| Edge cases | Known limits, error states |

### Routines (`docs/routines/`)

One file per operational procedure. Required sections:

| Section | Description |
|---------|-------------|
| Trigger | What starts this routine (manual, cron, event) |
| Steps | Numbered steps to execute |
| Rollback | How to undo if something goes wrong |
| Verification | How to confirm success |
| Required secrets | Secrets/tokens needed |
| Ownership | Who maintains this |

### File naming

- Lowercase, kebab-case: `okr-sjekken.md`, `deploy.md`
- Feature files match the route/tool name
- Routine files match the action: `deploy.md`, `rollback.md`, `visual-regression.md`

### Single source of truth

- Don't duplicate content across docs. Link instead.
- `CLAUDE.md` is the source for architecture, code standards, and env vars.
- `docs/` is the source for feature behavior and operational procedures.

---

## Quick reference

| Topic | Location |
|-------|----------|
| Getting started | `QUICKSTART.md` |
| Architecture & code standards | `CLAUDE.md` |
| Contributing & doc rules | `CONTRIBUTING.md` |
| Deploy | `docs/routines/deploy.md` |
| Testing | `docs/testing.md` |
| Design principles | `docs/DESIGN_PRINCIPLES.md` |
| Security tests | `docs/security/SECURITY_TESTS.md` |

### Feature docs

- [OKR-sjekken](features/okr-sjekken.md)

### Routine docs

- [Deploy to production](routines/deploy.md)

### Deployment

- [Quick deploy](deployment/DEPLOY_QUICK.md)
- [GitHub deploy](deployment/GITHUB_DEPLOY.md)
- [Custom domain](deployment/CUSTOM_DOMAIN_SETUP.md)
- [Domeneshop DNS](deployment/DOMENESHOP_DNS_SETUP.md)

### Development

- [Branch guide](development/BRANCH_GUIDE.md)
- [Testing](development/TESTING.md)
- [Test environment](development/TESTMILJO.md)
- [Monitoring](development/MONITORING.md)

### Design

- [Contrast analysis](design/CONTRAST_ANALYSIS.md)
- [WCAG compliance](design/WCAG_COMPLIANCE.md)
