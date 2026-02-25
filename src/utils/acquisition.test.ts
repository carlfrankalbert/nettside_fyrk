import { describe, it, expect } from 'vitest';
import {
  sanitizeReferrer,
  sanitizeUtmValue,
  incrementField,
  mergeAcquisitionData,
  emptyAcquisitionData,
  MAX_ACQUISITION_ENTRIES,
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

describe('incrementField', () => {
  it('increments existing key', () => {
    const field: Record<string, number> = { google: 3 };
    incrementField(field, 'google');
    expect(field.google).toBe(4);
  });

  it('adds new key with count 1', () => {
    const field: Record<string, number> = {};
    incrementField(field, 'facebook');
    expect(field.facebook).toBe(1);
  });

  it('skips undefined key', () => {
    const field: Record<string, number> = {};
    incrementField(field, undefined);
    expect(Object.keys(field)).toHaveLength(0);
  });

  it('respects max entry cap for new keys', () => {
    const field: Record<string, number> = {};
    // Fill to cap
    for (let i = 0; i < 5; i++) {
      field[`key${i}`] = 1;
    }
    incrementField(field, 'new-key', 5);
    expect(field['new-key']).toBeUndefined();
    expect(Object.keys(field)).toHaveLength(5);
  });

  it('still increments existing keys when at cap', () => {
    const field: Record<string, number> = {};
    for (let i = 0; i < 5; i++) {
      field[`key${i}`] = 1;
    }
    incrementField(field, 'key0', 5);
    expect(field.key0).toBe(2);
  });

  it('uses MAX_ACQUISITION_ENTRIES as default cap', () => {
    expect(MAX_ACQUISITION_ENTRIES).toBe(500);
  });
});

describe('mergeAcquisitionData', () => {
  it('merges counts from source into target', () => {
    const target = emptyAcquisitionData();
    const source = emptyAcquisitionData();
    source.referrers['google.com'] = 5;
    source.sources['linkedin'] = 3;

    mergeAcquisitionData(target, source);

    expect(target.referrers['google.com']).toBe(5);
    expect(target.sources['linkedin']).toBe(3);
  });

  it('sums counts for overlapping keys', () => {
    const target = emptyAcquisitionData();
    target.referrers['google.com'] = 3;
    target.sources['linkedin'] = 2;

    const source = emptyAcquisitionData();
    source.referrers['google.com'] = 7;
    source.sources['linkedin'] = 4;

    mergeAcquisitionData(target, source);

    expect(target.referrers['google.com']).toBe(10);
    expect(target.sources['linkedin']).toBe(6);
  });

  it('handles empty source', () => {
    const target = emptyAcquisitionData();
    target.referrers['google.com'] = 5;

    mergeAcquisitionData(target, emptyAcquisitionData());

    expect(target.referrers['google.com']).toBe(5);
  });

  it('handles empty target', () => {
    const target = emptyAcquisitionData();
    const source = emptyAcquisitionData();
    source.mediums['cpc'] = 10;
    source.campaigns['spring'] = 2;

    mergeAcquisitionData(target, source);

    expect(target.mediums['cpc']).toBe(10);
    expect(target.campaigns['spring']).toBe(2);
  });

  it('merges all four fields independently', () => {
    const target = emptyAcquisitionData();
    const source: typeof target = {
      referrers: { 'a.com': 1 },
      sources: { twitter: 2 },
      mediums: { social: 3 },
      campaigns: { launch: 4 },
    };

    mergeAcquisitionData(target, source);

    expect(target.referrers['a.com']).toBe(1);
    expect(target.sources['twitter']).toBe(2);
    expect(target.mediums['social']).toBe(3);
    expect(target.campaigns['launch']).toBe(4);
  });
});
