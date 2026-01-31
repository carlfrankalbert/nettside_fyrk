#!/usr/bin/env npx tsx
/**
 * Generate release notes from a merged PR
 *
 * Usage: npx tsx scripts/generate-release-notes.ts --pr <number>
 *
 * Requires:
 * - ANTHROPIC_API_KEY environment variable
 * - gh CLI authenticated
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// --- Config ---

const SUSPICIOUS_PATTERNS = [
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Emails
  /(?:sk-|xoxb-|ghp_|gho_|AKIA|aws_secret)[a-zA-Z0-9_]{10,}/, // API keys/tokens
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, // Private keys
  /Bearer\s+[a-zA-Z0-9._-]{20,}/, // Bearer tokens
  /(?:\+47|0047)[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/, // Norwegian phone numbers
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUIDs (potential session IDs)
];

// --- Helpers ---

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function getPRData(prNumber: string) {
  const json = run(
    `gh pr view ${prNumber} --json title,body,labels,files,mergedAt,headRefName`
  );
  return JSON.parse(json) as {
    title: string;
    body: string;
    labels: { name: string }[];
    files: { path: string; additions: number; deletions: number }[];
    mergedAt: string;
    headRefName: string;
  };
}

function scanForSuspiciousContent(text: string): string[] {
  const findings: string[] = [];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      findings.push(`Suspicious pattern found: ${match[0].slice(0, 20)}...`);
    }
  }
  return findings;
}

function buildPrompt(pr: ReturnType<typeof getPRData>): string {
  const labels = pr.labels.map((l) => l.name).join(', ') || 'none';
  const files = pr.files.map((f) => `  ${f.path} (+${f.additions}/-${f.deletions})`).join('\n');

  return `You are writing a release note for a Norwegian consulting website (FYRK).
Write in Norwegian (bokmål). Be concise and user-focused.

PR title: ${pr.title}
PR body:
${pr.body || '(no description)'}

Labels: ${labels}
Changed files:
${files}

Write a release note with this exact frontmatter format (YAML):
---
title: "<descriptive title in Norwegian>"
date: ${new Date().toISOString().split('T')[0]}
summary: "<one sentence summary in Norwegian>"
tags: [<relevant tags from: fix, feature, perf, security, a11y, docs, internal>]
audience: "<one of: user-facing, technical, internal>"
draft: false
---

Then write 2-4 short sections with ## headings explaining what changed and why it matters.
Do NOT include any IP addresses, email addresses, API keys, or other sensitive data.
Keep it factual and brief.`;
}

// --- Main ---

async function main() {
  const prArg = process.argv.find((a) => a.startsWith('--pr='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--pr') + 1];

  if (!prArg) {
    console.error('Usage: npx tsx scripts/generate-release-notes.ts --pr <number>');
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is required');
    process.exit(1);
  }

  console.log(`Fetching PR #${prArg}...`);
  const pr = getPRData(prArg);

  console.log(`Generating release notes for: ${pr.title}`);
  const prompt = buildPrompt(pr);

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    console.error('Unexpected response type');
    process.exit(1);
  }

  let markdown = content.text.trim();

  // Quality gate: scan for suspicious content
  const findings = scanForSuspiciousContent(markdown);
  if (findings.length > 0) {
    console.warn('⚠️  Suspicious content detected:');
    findings.forEach((f) => console.warn(`  - ${f}`));
    markdown += '\n\n## Needs review\n\nThis release note was flagged for manual review before publishing.\n';
  }

  // Generate filename from date and slugified title
  const dateStr = new Date().toISOString().split('T')[0];
  const titleMatch = markdown.match(/^title:\s*"(.+)"/m);
  const slug = (titleMatch?.[1] ?? prArg)
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `${dateStr}-${slug}.md`;
  const outPath = resolve('src/content/releaselog', filename);

  writeFileSync(outPath, markdown, 'utf-8');
  console.log(`✅ Written to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
