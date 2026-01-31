import { describe, it, expect } from 'vitest';
import { toMarkdown } from '../src/lib/markdown-export';
import type { DayEntry, DecisionLock } from '../src/lib/supabase';

function makeEntry(overrides?: Partial<DayEntry>): DayEntry {
  return {
    id: '1',
    user_id: 'u1',
    date: '2025-01-15',
    one_thing: 'Ship the MVP',
    problem_what: 'Users cannot onboard',
    problem_why: 'No signup flow exists',
    problem_who: 'New users',
    problem_constraints: 'Must ship this week',
    production: 'Build signup form',
    is_locked: true,
    locked_at: '2025-01-15T18:00:00Z',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-01-15T18:00:00Z',
    ...overrides,
  };
}

function makeLock(overrides?: Partial<DecisionLock>): DecisionLock {
  return {
    id: 'l1',
    day_entry_id: '1',
    decision_text: 'We ship the MVP with email-only signup',
    assumptions: 'Users prefer email over social login',
    practical_change: 'Add /signup route and email verification',
    shared_with_fyrk: false,
    share_token: null,
    created_at: '2025-01-15T18:00:00Z',
    ...overrides,
  };
}

describe('toMarkdown', () => {
  it('includes all fields', () => {
    const md = toMarkdown(makeEntry(), makeLock());

    expect(md).toContain('# Decision: Ship the MVP');
    expect(md).toContain('**Date:** 2025-01-15');
    expect(md).toContain('## Decision');
    expect(md).toContain('We ship the MVP with email-only signup');
    expect(md).toContain('## Assumptions');
    expect(md).toContain('Users prefer email over social login');
    expect(md).toContain('## Practical Change');
    expect(md).toContain('Add /signup route and email verification');
    expect(md).toContain('## Problem Clarity');
    expect(md).toContain('**What:** Users cannot onboard');
    expect(md).toContain('**Why:** No signup flow exists');
    expect(md).toContain('**Who:** New users');
    expect(md).toContain('**Constraints:** Must ship this week');
    expect(md).toContain('## Production');
    expect(md).toContain('Build signup form');
  });

  it('omits empty optional fields', () => {
    const md = toMarkdown(
      makeEntry({ problem_what: null, problem_why: null, problem_who: null, problem_constraints: null, production: null }),
      makeLock({ assumptions: null, practical_change: null })
    );

    expect(md).not.toContain('## Assumptions');
    expect(md).not.toContain('## Practical Change');
    expect(md).not.toContain('## Problem Clarity');
    expect(md).not.toContain('## Production');
  });

  it('includes share URL when provided', () => {
    const md = toMarkdown(makeEntry(), makeLock(), 'https://example.com/share/abc');
    expect(md).toContain('Share link: https://example.com/share/abc');
  });

  it('excludes share URL when not provided', () => {
    const md = toMarkdown(makeEntry(), makeLock());
    expect(md).not.toContain('Share link:');
  });
});
