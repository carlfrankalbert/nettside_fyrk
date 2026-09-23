import { describe, it, expect } from 'vitest';
import { generateRequestId } from './request-utils';

describe('generateRequestId', () => {
  it('returns a UUID', () => {
    expect(generateRequestId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('returns a different id on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, generateRequestId));
    expect(ids.size).toBe(100);
  });
});
