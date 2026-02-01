#!/usr/bin/env node

/**
 * Docs Impact Gate
 *
 * Checks whether a PR that changes code also includes documentation updates.
 * Exits with code 1 if code changed but no docs changed and no bypass phrase found.
 *
 * Usage:
 *   node scripts/check-docs-impact.mjs [--pr-body <string>]
 *   PR_BODY="..." node scripts/check-docs-impact.mjs
 *
 * The PR body can contain "DOCS-NOT-NEEDED: <reason>" to bypass the check.
 */

import { execSync } from 'node:child_process';

const CODE_PATHS = ['src/', 'apps/', 'scripts/', '.github/workflows/', 'pages/'];
const DOCS_PATHS = ['docs/', 'CONTRIBUTING.md', 'README.md', 'CLAUDE.md', 'TESTING.md', 'QUICKSTART.md'];
const BYPASS_PATTERN = /DOCS-NOT-NEEDED:\s*\S/i;

function getChangedFiles() {
  try {
    const base = process.env.BASE_REF || 'origin/main';
    const diff = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' });
    return diff.trim().split('\n').filter(Boolean);
  } catch {
    // Fallback: compare with HEAD~1
    try {
      const diff = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
      return diff.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function main() {
  const prBody = process.env.PR_BODY || process.argv.slice(2).join(' ') || '';

  // Check bypass
  if (BYPASS_PATTERN.test(prBody)) {
    console.log('Docs gate: bypassed via DOCS-NOT-NEEDED.');
    process.exit(0);
  }

  const files = getChangedFiles();
  if (files.length === 0) {
    console.log('Docs gate: no changed files detected.');
    process.exit(0);
  }

  const codeChanged = files.some((f) => CODE_PATHS.some((p) => f.startsWith(p)));
  const docsChanged = files.some((f) => DOCS_PATHS.some((p) => f.startsWith(p)));

  if (!codeChanged) {
    console.log('Docs gate: no code changes detected, skipping.');
    process.exit(0);
  }

  if (docsChanged) {
    console.log('Docs gate: code and docs both changed. OK.');
    process.exit(0);
  }

  // Code changed but no docs
  console.error(`
Docs gate FAILED

Code files changed but no documentation was updated.
Changed code files:
${files.filter((f) => CODE_PATHS.some((p) => f.startsWith(p))).map((f) => `  - ${f}`).join('\n')}

To fix, either:
  1. Update relevant docs (see CONTRIBUTING.md for rules)
  2. Add "DOCS-NOT-NEEDED: <reason>" to your PR description

See: CONTRIBUTING.md#documentation-update-rules
`);
  process.exit(1);
}

main();
