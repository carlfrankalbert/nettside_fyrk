import { describe, it, expect } from 'vitest';
import { shouldExcludeRequest } from './tracking-exclusion';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function request(url: string, headers: Record<string, string> = { 'user-agent': BROWSER_UA }) {
  return new Request(url, { method: 'POST', headers });
}

describe('shouldExcludeRequest', () => {
  it('counts a normal browser on fyrk.no', () => {
    expect(shouldExcludeRequest(request('https://fyrk.no/api/pageview'))).toBe(false);
  });

  it('counts local development, which writes to its own local KV', () => {
    expect(shouldExcludeRequest(request('http://localhost:4321/api/pageview'))).toBe(false);
  });

  it('excludes the workers.dev URL, which shares the production KV', () => {
    expect(
      shouldExcludeRequest(request('https://nettside-fyrk.carlfrankalbert.workers.dev/api/pageview'))
    ).toBe(true);
  });

  it('excludes branch preview URLs', () => {
    expect(
      shouldExcludeRequest(
        request('https://chore-astro-7-nettside-fyrk.carlfrankalbert.workers.dev/api/track')
      )
    ).toBe(true);
  });

  it('does not treat a lookalike path as a workers.dev host', () => {
    expect(shouldExcludeRequest(request('https://fyrk.no/workers.dev/api/pageview'))).toBe(false);
  });

  it('excludes requests without a user agent', () => {
    expect(shouldExcludeRequest(request('https://fyrk.no/api/pageview', {}))).toBe(true);
  });

  it('excludes automated browsers', () => {
    const ua = BROWSER_UA.replace('Chrome/', 'HeadlessChrome/');
    expect(shouldExcludeRequest(request('https://fyrk.no/api/pageview', { 'user-agent': ua }))).toBe(true);
  });

  it('excludes requests that opt out via header', () => {
    expect(
      shouldExcludeRequest(
        request('https://fyrk.no/api/pageview', { 'user-agent': BROWSER_UA, 'x-exclude-from-stats': 'true' })
      )
    ).toBe(true);
  });
});
