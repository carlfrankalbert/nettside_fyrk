import { describe, it, expect } from 'vitest';
import { isValidRequestBody } from './request-validation';

describe('isValidRequestBody', () => {
  it('accepts valid body with input and stream', () => {
    expect(isValidRequestBody({ input: 'test', stream: true })).toBe(true);
  });

  it('accepts body with only input', () => {
    expect(isValidRequestBody({ input: 'test' })).toBe(true);
  });

  it('accepts body with only stream', () => {
    expect(isValidRequestBody({ stream: false })).toBe(true);
  });

  it('accepts empty object', () => {
    expect(isValidRequestBody({})).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidRequestBody(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidRequestBody('string')).toBe(false);
    expect(isValidRequestBody(42)).toBe(false);
    expect(isValidRequestBody(undefined)).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidRequestBody({ input: 123 })).toBe(false);
    expect(isValidRequestBody({ input: true })).toBe(false);
    expect(isValidRequestBody({ input: {} })).toBe(false);
  });

  it('rejects non-boolean stream', () => {
    expect(isValidRequestBody({ stream: 'true' })).toBe(false);
    expect(isValidRequestBody({ stream: 1 })).toBe(false);
  });
});
