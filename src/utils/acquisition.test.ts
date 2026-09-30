import { describe, it, expect } from 'vitest';
import {
  sanitizeReferrer,
  sanitizeUtmValue,
} from './acquisition';

describe('sanitizeReferrer', () => {
  it('returns valid domain unchanged', () => {
    expect(sanitizeReferrer('google.com')).toBe('google.com');
  });

  it('lowercases input', () => {
    expect(sanitizeReferrer('Google.COM')).toBe('google.com');
  });

  it('strips invalid characters', () => {
    // Only angle brackets are stripped, leaving alphabetic chars
    expect(sanitizeReferrer('google<script>.com')).toBe('googlescript.com');
    expect(sanitizeReferrer('evil{}.com')).toBe('evil.com');
  });

  it('allows subdomains', () => {
    expect(sanitizeReferrer('news.ycombinator.com')).toBe('news.ycombinator.com');
  });

  it('rejects value without a dot', () => {
    expect(sanitizeReferrer('localhost')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeReferrer('')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeReferrer(undefined)).toBeUndefined();
  });

  it('truncates to 253 characters', () => {
    const long = 'a'.repeat(250) + '.com';
    const result = sanitizeReferrer(long);
    expect(result!.length).toBeLessThanOrEqual(253);
  });

  it('allows hyphens in domains', () => {
    expect(sanitizeReferrer('my-site.example.com')).toBe('my-site.example.com');
  });

  it('allows numeric domains', () => {
    expect(sanitizeReferrer('123.456.com')).toBe('123.456.com');
  });
});

describe('sanitizeUtmValue', () => {
  it('returns valid value unchanged', () => {
    expect(sanitizeUtmValue('linkedin')).toBe('linkedin');
  });

  it('lowercases input', () => {
    expect(sanitizeUtmValue('LinkedIn')).toBe('linkedin');
  });

  it('strips special characters', () => {
    expect(sanitizeUtmValue('linked<in>')).toBe('linkedin');
  });

  it('allows hyphens', () => {
    expect(sanitizeUtmValue('my-campaign')).toBe('my-campaign');
  });

  it('allows underscores', () => {
    expect(sanitizeUtmValue('my_campaign')).toBe('my_campaign');
  });

  it('allows dots', () => {
    expect(sanitizeUtmValue('v2.0')).toBe('v2.0');
  });

  it('allows plus signs', () => {
    expect(sanitizeUtmValue('a+b')).toBe('a+b');
  });

  it('allows spaces', () => {
    expect(sanitizeUtmValue('spring sale')).toBe('spring sale');
  });

  it('trims whitespace', () => {
    expect(sanitizeUtmValue('  linkedin  ')).toBe('linkedin');
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeUtmValue('')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeUtmValue(undefined)).toBeUndefined();
  });

  it('returns undefined for whitespace-only input', () => {
    expect(sanitizeUtmValue('   ')).toBeUndefined();
  });

  it('truncates to 200 characters', () => {
    const long = 'a'.repeat(250);
    const result = sanitizeUtmValue(long);
    expect(result!.length).toBeLessThanOrEqual(200);
  });
});
