#!/usr/bin/env node

/**
 * Docs Impact Gate (hard/soft)
 *
 * HARD paths (src/, apps/, pages/, etc.) — require docs or explicit exemption.
 * SOFT paths (.github/, scripts/, etc.) — print notice, never fail.
 *
 * Exemption token in PR body:
 *   DOCS-IMPACT: none — <reason>
 *   (legacy: DOCS-NOT-NEEDED: <reason> also accepted)
 *
 * Usage:
 *   PR_BODY="..." BASE_REF="origin/main" node scripts/check-docs-impact.mjs
 */

import { execSync } from 'node:child_process';

const HARD_PATHS = [
  'src/',
  'apps/',
  'pages/',
  'components/',
  'lib/',
  'api/',
  'functions/',
  'workers/',
  'server/',
  'packages/',
];

const SOFT_PATHS = [
  '.github/',
  'scripts/',
  'tooling/',
  'config/',
];

const DOCS_PATHS = [
  'docs/',
  'CONTRIBUTING.md',
  'README.md',
  'CLAUDE.md',
  'TESTING.md',
  'QUICKSTART.md',
];

const EXEMPT_PATTERN = /DOCS-IMPACT:\s*none\s*[—–-]\s*\S/i;
const LEGACY_PATTERN = /DOCS-NOT-NEEDED:\s*\S/i;

function getChangedFiles() {
  try {
    const base = process.env.BASE_REF || 'origin/main';
    const diff = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' });
    return diff.trim().split('\n').filter(Boolean);
  } catch {
    try {
      const diff = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
      return diff.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function matchesAny(file, paths) {
  return paths.some((p) => file.startsWith(p));
}

function main() {
  const prBody = process.env.PR_BODY || '';

  // Check exemption tokens
  if (EXEMPT_PATTERN.test(prBody) || LEGACY_PATTERN.test(prBody)) {
    console.log('Docs gate: exempt via DOCS-IMPACT token.');
    process.exit(0);
  }

  const files = getChangedFiles();
  if (files.length === 0) {
    console.log('Docs gate: no changed files detected.');
    process.exit(0);
  }

  const hardChanged = files.filter((f) => matchesAny(f, HARD_PATHS));
  const softChanged = files.filter((f) => matchesAny(f, SOFT_PATHS));
  const docsChanged = files.some((f) => matchesAny(f, DOCS_PATHS));

  // If docs changed, always pass
  if (docsChanged) {
    console.log('Docs gate: docs updated. OK.');
    process.exit(0);
  }

  // HARD paths changed without docs → fail
  if (hardChanged.length > 0) {
    console.error(`
Docs gate FAILED — HARD code changed without docs update.

Changed product files:
${hardChanged.map((f) => `  - ${f}`).join('\n')}

To fix, either:
  1. Update relevant docs (see CONTRIBUTING.md for rules)
  2. Add to your PR description:  DOCS-IMPACT: none — <reason>

See: CONTRIBUTING.md#documentation-update-rules
`);
    process.exit(1);
  }

  // SOFT paths only → notice, pass
  if (softChanged.length > 0) {
    console.log(`Docs gate: only infra/tooling files changed (soft path). Consider updating docs if relevant.`);
    console.log(`  Changed: ${softChanged.join(', ')}`);
    process.exit(0);
  }

  // No hard or soft matches (e.g. only root config files)
  console.log('Docs gate: no monitored paths changed, skipping.');
  process.exit(0);
}

main();
