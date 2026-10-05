import { describe, it, expect } from 'vitest';
import {
  classifyDevice,
  classifyBrowser,
  sanitizeCountry,
  sanitizeOrganization,
  sanitizeNotFoundPath,
  sanitizeAsn,
  isDatacenterNetwork,
} from './visitor-dimensions';


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

describe('sanitizeAsn', () => {
  it('accepts positive 32-bit integers only', () => {
    expect(sanitizeAsn(2119)).toBe(2119);
    expect(sanitizeAsn(0)).toBeUndefined();
    expect(sanitizeAsn(-1)).toBeUndefined();
    expect(sanitizeAsn(1.5)).toBeUndefined();
    expect(sanitizeAsn(2 ** 32)).toBeUndefined();
    expect(sanitizeAsn('2119')).toBeUndefined();
    expect(sanitizeAsn(undefined)).toBeUndefined();
  });
});

describe('isDatacenterNetwork', () => {
  it('flags cloud and hosting providers', () => {
    expect(isDatacenterNetwork('Amazon.com, Inc.')).toBe(true);
    expect(isDatacenterNetwork('Hetzner Online GmbH')).toBe(true);
    expect(isDatacenterNetwork('DigitalOcean, LLC')).toBe(true);
  });

  it('flags the hosting and VPN networks seen in bot traffic on 2026-10-05', () => {
    expect(isDatacenterNetwork('LogicWeb Inc.')).toBe(true);
    expect(isDatacenterNetwork('RapidSeedbox Ltd')).toBe(true);
    expect(isDatacenterNetwork('Microsoft Limited')).toBe(true);
    expect(isDatacenterNetwork('Example Hosting LLC')).toBe(true);
    expect(isDatacenterNetwork('Some Data Center Ltd')).toBe(true);
  });

  it('does not flag ISPs or companies', () => {
    expect(isDatacenterNetwork('Telenor Norge AS')).toBe(false);
    expect(isDatacenterNetwork('Private Customer')).toBe(false);
    expect(isDatacenterNetwork('Equinor ASA')).toBe(false);
    expect(isDatacenterNetwork('Awsome AS')).toBe(false);
    expect(isDatacenterNetwork('Google Fiber Inc.')).toBe(false);
    expect(isDatacenterNetwork('Telia Company AB')).toBe(false);
  });
});
