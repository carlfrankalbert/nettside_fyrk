## Summary
<!-- 1-3 bullet points describing what changed and why -->

## User impact
<!-- What changes for the end user? "None" if internal only -->

## Risk
<!-- What could break? -->

## Docs

<!-- You MUST do one of the following: -->
<!-- Option A: link updated doc files -->
<!-- Option B: write the exemption token (exactly as shown) -->

**Docs updated:** <!-- docs/features/x.md, docs/routines/y.md -->
**OR** `DOCS-IMPACT: none — <reason why no docs needed>`

### Doc Impact checklist

- [ ] User-facing behavior changed
- [ ] New/changed routes/pages/tools
- [ ] New/changed env vars or secrets
- [ ] Ops routine introduced/changed (deploy/release/migration/etc.)
- [ ] API/data contract changed
- [ ] None of the above (explain briefly)

## Checklist

- [ ] Updated/added Playwright tests for new/changed behavior
- [ ] Updated visual snapshots if UI changed (`npx playwright test --update-snapshots`)
- [ ] Added `data-testid` for any new interactive elements used in tests
- [ ] Verified tests locally: `npm run test:unit` + smoke/visual as needed
- [ ] No new TypeScript errors (`npm run typecheck`)
- [ ] No new lint warnings (`npm run lint`)

## Visual changes
<!-- If UI changed: include before/after screenshots or note "no visual changes" -->
