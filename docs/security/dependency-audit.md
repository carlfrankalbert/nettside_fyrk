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

| Advisory | Package | Accepted because | Cleared by |
|----------|---------|------------------|------------|
| [GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) — RCE via AVIF image optimization (CVSS 9.8) | `astro` ≤ 7.2.7 | Build-time only, in `libheif` via Sharp. It requires Astro to process an **untrusted** AVIF image. This site optimizes images committed to the repository; there is no user-supplied image path. | Astro 7.2.8+ |
| [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) — libvips vulnerabilities in Sharp | `sharp` | Same reasoning: build-time image optimization of our own assets. | Astro 7 (pulls a patched Sharp) |

Both clear with the same upgrade, which is not a dependency bump: Astro 7
requires `@astrojs/cloudflare` 14, which **dropped Cloudflare Pages support** in
favour of Workers. That is a hosting migration — new Workers project, KV
bindings moved into Wrangler config, `Astro.locals.runtime` replaced, custom
domain moved — and it is tracked separately, not carried along by an unrelated
change.

## When adding to the list

An advisory belongs here only when it cannot be acted on now **and** the
exposure has been reasoned about, not assumed. Write down what an attacker
would have to control to exploit it. If that is something this site actually
accepts from outside, it does not belong on this list — it belongs in a fix.
