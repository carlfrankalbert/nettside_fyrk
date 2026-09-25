import { describe, it, expect, vi } from 'vitest';
import {
  classifyDevice,
  classifyBrowser,
  sanitizeCountry,
  sanitizeOrganization,
  sanitizeNotFoundPath,
  recordAudience,
  recordNotFound,
  readAudience,
  MAX_DIMENSION_ENTRIES,
} from './visitor-dimensions';

function createMockKV(store: Record<string, string> = {}) {
  return {
    get: vi.fn(async (key: string) => store[key] ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
  } as unknown as KVNamespace;
}

const UA = {
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  androidPhone: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
  androidTablet: 'Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0 Mobile Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 Edg/140.0',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
};

describe('classifyDevice', () => {
  it.each([
    [UA.macChrome, 'Desktop'],
    [UA.edge, 'Desktop'],
    [UA.iphone, 'Mobil'],
    [UA.androidPhone, 'Mobil'],
    [UA.ipad, 'Nettbrett'],
    [UA.androidTablet, 'Nettbrett'],
  ])('%s → %s', (ua, expected) => {
    expect(classifyDevice(ua)).toBe(expected);
  });
});

describe('classifyBrowser', () => {
  it.each([
    [UA.macChrome, 'Chrome'],
    [UA.iphoneChrome, 'Chrome'],
    [UA.macSafari, 'Safari'],
    [UA.iphone, 'Safari'],
    [UA.edge, 'Edge'],
    [UA.firefox, 'Firefox'],
    [UA.samsung, 'Samsung Internet'],
    ['curl/8.0', 'Annet'],
  ])('%s → %s', (ua, expected) => {
    expect(classifyBrowser(ua)).toBe(expected);
  });
});

describe('sanitizers', () => {
  it('accepts ISO country codes and drops unknown/Tor', () => {
    expect(sanitizeCountry('NO')).toBe('NO');
    expect(sanitizeCountry('XX')).toBeUndefined();
    expect(sanitizeCountry('T1')).toBeUndefined();
    expect(sanitizeCountry('no')).toBeUndefined();
    expect(sanitizeCountry(undefined)).toBeUndefined();
  });

  it('keeps organisation names readable and bounded', () => {
    expect(sanitizeOrganization('Telenor Norge AS')).toBe('Telenor Norge AS');
    expect(sanitizeOrganization('Norsk  Helsenett <script>')).toBe('Norsk Helsenett script');
    expect(sanitizeOrganization('x'.repeat(200))).toHaveLength(80);
    expect(sanitizeOrganization('')).toBeUndefined();
  });

  it('keeps only the path of a 404 URL', () => {
    expect(sanitizeNotFoundPath('/gammel-side?utm_source=x#top')).toBe('/gammel-side');
    expect(sanitizeNotFoundPath('/a"><img>')).toBe('/aimg');
    expect(sanitizeNotFoundPath('/')).toBeUndefined();
    expect(sanitizeNotFoundPath('https://evil.example/x')).toBeUndefined();
    expect(sanitizeNotFoundPath('/' + 'a'.repeat(300))).toHaveLength(150);
  });
});

describe('recordAudience', () => {
  it('counts one visitor per field for the day and all-time', async () => {
    const store: Record<string, string> = {};
    const kv = createMockKV(store);

    await recordAudience(kv, '2026-09-25', { country: 'NO', asOrganization: 'Equinor ASA' }, UA.iphone);
    await recordAudience(kv, '2026-09-25', { country: 'SE' }, UA.macChrome);

    const day = JSON.parse(store['audience:2026-09-25']);
    expect(day.countries).toEqual({ NO: 1, SE: 1 });
    expect(day.organizations).toEqual({ 'Equinor ASA': 1 });
    expect(day.devices).toEqual({ Mobil: 1, Desktop: 1 });
    expect(day.browsers).toEqual({ Safari: 1, Chrome: 1 });
    expect(JSON.parse(store.audience_total)).toEqual(day);
  });

  it('caps the number of distinct values per field', async () => {
    const organizations = Object.fromEntries(
      Array.from({ length: MAX_DIMENSION_ENTRIES }, (_, i) => [`Org ${i}`, 1]),
    );
    const store: Record<string, string> = {
      'audience:2026-09-25': JSON.stringify({ countries: {}, organizations, devices: {}, browsers: {} }),
    };
    const kv = createMockKV(store);

    await recordAudience(kv, '2026-09-25', { asOrganization: 'New Org' }, UA.macChrome);

    expect(JSON.parse(store['audience:2026-09-25']).organizations['New Org']).toBeUndefined();
  });
});

describe('recordNotFound + readAudience', () => {
  it('aggregates 404 paths and audience across days', async () => {
    const store: Record<string, string> = {};
    const kv = createMockKV(store);

    await recordNotFound(kv, '2026-09-24', '/gammel');
    await recordNotFound(kv, '2026-09-25', '/gammel?x=1');
    await recordNotFound(kv, '2026-09-25', '/'); // ignored
    await recordAudience(kv, '2026-09-24', { country: 'NO' }, UA.macChrome);
    await recordAudience(kv, '2026-09-25', { country: 'NO' }, UA.iphone);

    const twoDays = await readAudience(kv, ['2026-09-24', '2026-09-25']);
    expect(twoDays.notFound).toEqual({ '/gammel': 2 });
    expect(twoDays.audience.countries).toEqual({ NO: 2 });

    const allTime = await readAudience(kv, 'all');
    expect(allTime.notFound).toEqual({ '/gammel': 2 });
    expect(allTime.audience.devices).toEqual({ Desktop: 1, Mobil: 1 });
  });

  it('returns empty data when nothing is stored', async () => {
    const result = await readAudience(createMockKV(), ['2026-09-25']);
    expect(result.notFound).toEqual({});
    expect(result.audience.countries).toEqual({});
  });
});
