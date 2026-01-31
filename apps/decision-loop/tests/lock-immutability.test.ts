import { describe, it, expect } from 'vitest';

// Mock the API lock logic (extracted for testability)
function validateLockRequest(entry: { is_locked: boolean; user_id: string }, userId: string) {
  if (!entry) return { error: 'Entry not found', status: 404 };
  if (entry.user_id !== userId) return { error: 'Not authorized', status: 403 };
  if (entry.is_locked) return { error: 'Entry already locked', status: 409 };
  return null;
}

describe('lock immutability', () => {
  it('rejects locking an already locked entry', () => {
    const result = validateLockRequest({ is_locked: true, user_id: 'u1' }, 'u1');
    expect(result).toEqual({ error: 'Entry already locked', status: 409 });
  });

  it('rejects unauthorized user', () => {
    const result = validateLockRequest({ is_locked: false, user_id: 'u1' }, 'u2');
    expect(result).toEqual({ error: 'Not authorized', status: 403 });
  });

  it('allows locking own unlocked entry', () => {
    const result = validateLockRequest({ is_locked: false, user_id: 'u1' }, 'u1');
    expect(result).toBeNull();
  });
});
