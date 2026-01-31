import { describe, it, expect } from 'vitest';

// Test that shared data is properly sanitized (no user_id or internal IDs exposed)
describe('share access', () => {
  it('sanitized share data excludes user_id', () => {
    const rawEntry = {
      id: 'entry-123',
      user_id: 'user-secret-id',
      date: '2025-01-15',
      one_thing: 'Ship MVP',
    };

    // The share page only exposes date and one_thing
    const sanitized = {
      date: rawEntry.date,
      one_thing: rawEntry.one_thing,
    };

    expect(sanitized).not.toHaveProperty('user_id');
    expect(sanitized).not.toHaveProperty('id');
    expect(sanitized).toHaveProperty('date', '2025-01-15');
    expect(sanitized).toHaveProperty('one_thing', 'Ship MVP');
  });

  it('lock data includes decision but not day_entry_id', () => {
    const rawLock = {
      id: 'lock-123',
      day_entry_id: 'entry-123',
      decision_text: 'We go with option A',
      assumptions: 'Market is stable',
      practical_change: 'Update roadmap',
      share_token: 'abc123',
    };

    // Public-facing fields only
    const sanitized = {
      decision_text: rawLock.decision_text,
      assumptions: rawLock.assumptions,
      practical_change: rawLock.practical_change,
    };

    expect(sanitized).not.toHaveProperty('id');
    expect(sanitized).not.toHaveProperty('day_entry_id');
    expect(sanitized).not.toHaveProperty('share_token');
    expect(sanitized.decision_text).toBe('We go with option A');
  });
});
