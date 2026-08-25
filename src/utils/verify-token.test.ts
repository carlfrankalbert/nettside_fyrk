import { describe, it, expect } from 'vitest';
import { verifyToken, extractBearerToken } from './verify-token';

describe('verifyToken', () => {
  it('returns true for identical tokens', () => {
    expect(verifyToken('s3cret-token', 's3cret-token')).toBe(true);
  });

  it('returns false for differing tokens of equal length', () => {
    expect(verifyToken('s3cret-token', 's3cret-tokeX')).toBe(false);
  });

  it('returns false for tokens of different length', () => {
    expect(verifyToken('short', 'short-and-then-some')).toBe(false);
    expect(verifyToken('short-and-then-some', 'short')).toBe(false);
  });

  it('returns false when the provided token is missing', () => {
    expect(verifyToken(null, 'expected')).toBe(false);
    expect(verifyToken(undefined, 'expected')).toBe(false);
    expect(verifyToken('', 'expected')).toBe(false);
  });

  it('returns false when the expected token is missing', () => {
    expect(verifyToken('provided', null)).toBe(false);
    expect(verifyToken('provided', undefined)).toBe(false);
    expect(verifyToken('provided', '')).toBe(false);
  });

  it('returns false when both are missing', () => {
    expect(verifyToken(null, null)).toBe(false);
    expect(verifyToken('', '')).toBe(false);
  });

  it('handles unicode tokens correctly', () => {
    expect(verifyToken('tøken-æøå', 'tøken-æøå')).toBe(true);
    expect(verifyToken('tøken-æøå', 'token-aoa')).toBe(false);
  });
});

describe('extractBearerToken', () => {
  const makeRequest = (auth?: string) =>
    new Request('https://example.com', auth ? { headers: { Authorization: auth } } : undefined);

  it('extracts a Bearer token', () => {
    expect(extractBearerToken(makeRequest('Bearer my-token'))).toBe('my-token');
  });

  it('returns null when the header is absent', () => {
    expect(extractBearerToken(makeRequest())).toBeNull();
  });

  it('returns null for a non-Bearer scheme', () => {
    expect(extractBearerToken(makeRequest('Basic abc123'))).toBeNull();
  });

  it('preserves tokens containing spaces after the scheme', () => {
    expect(extractBearerToken(makeRequest('Bearer a b c'))).toBe('a b c');
  });
});
