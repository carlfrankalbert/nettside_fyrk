# Dependency audit

`npm audit --audit-level=critical` runs in CI as the **Security Audit** job.
That job deliberately gates nothing else.

## Why it gates nothing

It used to be the first step of `Quality Gates`, which `Build`, `E2E Smoke
Tests` and `Accessibility & Contrast Tests` all depend on via `needs:`. When a
critical advisory appeared in a dependency we could not upgrade, every one of
those jobs was skipped — so CI reported failure while verifying nothing about
the pull request. A dependency advisory and a broken pull request are different
problems, and only one of them is the author's to fix.

The audit result therefore stays visible as its own check. Merging past a red
Security Audit is a deliberate decision, taken with the accepted-advisory list
below in hand.

## Currently accepted

None. `npm audit` reports 0 vulnerabilities.

The two advisories previously listed here — GHSA-26w7-cxv4-gfx2 (RCE via AVIF
image optimization in `astro` ≤ 7.2.7) and GHSA-f88m-g3jw-g9cj (libvips in
`sharp`) — cleared with the move to Astro 7 and `@astrojs/cloudflare` 14, which
also moved hosting from Cloudflare Pages to Workers.

## When adding to the list

An advisory belongs here only when it cannot be acted on now **and** the
exposure has been reasoned about, not assumed. Write down what an attacker
would have to control to exploit it. If that is something this site actually
accepts from outside, it does not belong on this list — it belongs in a fix.
