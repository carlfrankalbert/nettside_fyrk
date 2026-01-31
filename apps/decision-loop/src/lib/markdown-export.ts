import type { DayEntry, DecisionLock } from './supabase';

export function toMarkdown(
  entry: DayEntry,
  lock: DecisionLock,
  shareUrl?: string
): string {
  const lines: string[] = [];

  lines.push(`# Decision: ${entry.one_thing}`);
  lines.push(`**Date:** ${entry.date}`);
  lines.push('');

  lines.push('## Decision');
  lines.push(lock.decision_text);
  lines.push('');

  if (lock.assumptions) {
    lines.push('## Assumptions');
    lines.push(lock.assumptions);
    lines.push('');
  }

  if (lock.practical_change) {
    lines.push('## Practical Change');
    lines.push(lock.practical_change);
    lines.push('');
  }

  if (entry.problem_what || entry.problem_why || entry.problem_who || entry.problem_constraints) {
    lines.push('## Problem Clarity');
    if (entry.problem_what) lines.push(`**What:** ${entry.problem_what}`);
    if (entry.problem_why) lines.push(`**Why:** ${entry.problem_why}`);
    if (entry.problem_who) lines.push(`**Who:** ${entry.problem_who}`);
    if (entry.problem_constraints) lines.push(`**Constraints:** ${entry.problem_constraints}`);
    lines.push('');
  }

  if (entry.production) {
    lines.push('## Production');
    lines.push(entry.production);
    lines.push('');
  }

  if (shareUrl) {
    lines.push('---');
    lines.push(`Share link: ${shareUrl}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Exported from Decision Loop*');

  return lines.join('\n');
}
