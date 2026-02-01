## Summary
<!-- 1-3 bullet points describing what changed and why -->

## User impact
<!-- What changes for the end user? "None" if internal only -->

## Risk
<!-- What could break? -->

## Checklist

- [ ] Updated/added Playwright tests for new/changed behavior
- [ ] Updated visual snapshots if UI changed (`npx playwright test --update-snapshots`)
- [ ] Added `data-testid` for any new interactive elements used in tests
- [ ] Verified tests locally: `npm run test:unit` + smoke/visual as needed
- [ ] No new TypeScript errors (`npm run typecheck`)
- [ ] No new lint warnings (`npm run lint`)

## Visual changes
<!-- If UI changed: include before/after screenshots or note "no visual changes" -->
