import { describe, it, expect } from 'vitest';
import { cn } from './classes';

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('filters out null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('filters out false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('returns empty string with no valid classes', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  it('handles single class', () => {
    expect(cn('foo')).toBe('foo');
  });
});
