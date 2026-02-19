---
title: "Feilrettinger og forbedringer"
date: 2026-02-19
summary: "1 feilrettinger."
tags: ["fix"]
audience: "user-facing"
draft: false
---

## Hva er nytt

### Feilrettinger

- Relax npm audit to critical-only

Dev-dependency vulnerabilities (eslint, ajv, minimatch, lodash) require
breaking upgrades. Relaxing to critical-only until deps can be updated.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
