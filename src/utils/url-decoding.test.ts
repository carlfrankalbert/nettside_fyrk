import { describe, it, expect } from 'vitest';
import { isUrlEncoded, safeDecodeURIComponent } from './url-decoding';

describe('isUrlEncoded', () => {
  it('detects URL-encoded spaces', () => {
    expect(isUrlEncoded('hello%20world')).toBe(true);
  });

  it('detects URL-encoded newlines', () => {
    expect(isUrlEncoded('line1%0Aline2')).toBe(true);
  });

  it('detects URL-encoded UTF-8 sequences', () => {
    expect(isUrlEncoded('%C3%A5')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isUrlEncoded('hello world')).toBe(false);
  });

  it('returns false for hex-like strings without common encodings', () => {
    expect(isUrlEncoded('%FF')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isUrlEncoded('')).toBe(false);
  });
});

describe('safeDecodeURIComponent', () => {
  it('decodes URL-encoded text', () => {
    expect(safeDecodeURIComponent('hello%20world')).toBe('hello world');
  });

  it('returns original on invalid encoding', () => {
    expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A');
  });

  it('returns plain text unchanged', () => {
    expect(safeDecodeURIComponent('hello')).toBe('hello');
  });
});
