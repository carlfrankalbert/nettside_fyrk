// @vitest-environment node
// Server-side helper: happy-dom hides Set-Cookie on Response, as browsers do.
import { describe, it, expect } from 'vitest';
import {
  resolveTokenGate,
  serializeCookie,
  redirectWithCookie,
  withoutToken,
  hasStatsAccess,
  STATS_TOKEN_COOKIE,
  type CookieConfig,
} from './token-cookie';

const config: CookieConfig = { name: 'test_token', path: '/test', maxAgeSeconds: 3600 };
const EXPECTED = 'secret-token';

const at = (path: string) => new URL(`https://fyrk.no${path}`);

describe('serializeCookie', () => {
  it('writes an httpOnly, Secure, SameSite=Lax cookie scoped to the configured path', () => {
    expect(serializeCookie('abc', config)).toBe(
      'test_token=abc; Path=/test; Max-Age=3600; HttpOnly; Secure; SameSite=Lax'
    );
  });

  it('encodes values that are not cookie-safe', () => {
    expect(serializeCookie('a;b c', config)).toContain('test_token=a%3Bb%20c;');
  });
});

describe('withoutToken', () => {
  it('removes the token and keeps other parameters', () => {
    expect(withoutToken(at('/stats?token=x&period=7d'))).toBe('/stats?period=7d');
  });

  it('drops the query entirely when token was the only parameter', () => {
    expect(withoutToken(at('/stats?token=x'))).toBe('/stats');
  });
});

describe('redirectWithCookie', () => {
  it('returns an uncacheable 302 carrying the cookie', () => {
    const res = redirectWithCookie('/stats', 'c=1');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/stats');
    expect(res.headers.get('Set-Cookie')).toBe('c=1');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('resolveTokenGate', () => {
  it('is not-configured when no token is expected, whatever was provided', () => {
    expect(resolveTokenGate(at('/test?token=x'), 'y', undefined, config)).toEqual({
      status: 'not-configured',
    });
  });

  it('is missing when neither query nor cookie carries a token', () => {
    expect(resolveTokenGate(at('/test'), null, EXPECTED, config)).toEqual({ status: 'missing' });
  });

  it('exchanges a valid query token for a cookie and redirects to the clean URL', () => {
    const gate = resolveTokenGate(at('/test?token=secret-token&period=7d'), null, EXPECTED, config);
    expect(gate.status).toBe('redirect');
    if (gate.status !== 'redirect') return;
    expect(gate.response.status).toBe(302);
    expect(gate.response.headers.get('Location')).toBe('/test?period=7d');
    expect(gate.response.headers.get('Set-Cookie')).toContain('test_token=secret-token;');
  });

  it('grants access from a valid cookie without redirecting', () => {
    expect(resolveTokenGate(at('/test'), EXPECTED, EXPECTED, config)).toEqual({ status: 'granted' });
  });

  it('prefers the query token over the cookie', () => {
    const gate = resolveTokenGate(at('/test?token=secret-token'), 'old', EXPECTED, config);
    expect(gate.status).toBe('redirect');
  });

  it('asks to clear a stale cookie after token rotation', () => {
    expect(resolveTokenGate(at('/test'), 'old-token', EXPECTED, config)).toEqual({
      status: 'mismatch',
      clearCookie: true,
    });
  });

  it('keeps a valid cookie when only the query token is wrong', () => {
    expect(resolveTokenGate(at('/test?token=wrong'), EXPECTED, EXPECTED, config)).toEqual({
      status: 'mismatch',
      clearCookie: false,
    });
  });

  it('has no cookie to clear when a wrong token came only from the query', () => {
    expect(resolveTokenGate(at('/test?token=wrong'), null, EXPECTED, config)).toEqual({
      status: 'mismatch',
      clearCookie: false,
    });
  });
});

describe('hasStatsAccess', () => {
  const request = (headers: Record<string, string> = {}) =>
    new Request('https://fyrk.no/api/pageview?all=true', { headers });

  it('accepts a valid Bearer token', () => {
    expect(hasStatsAccess(request({ Authorization: `Bearer ${EXPECTED}` }), undefined, EXPECTED)).toBe(true);
  });

  it('accepts a valid stats cookie', () => {
    expect(hasStatsAccess(request(), EXPECTED, EXPECTED)).toBe(true);
  });

  it('rejects a missing or wrong token', () => {
    expect(hasStatsAccess(request(), undefined, EXPECTED)).toBe(false);
    expect(hasStatsAccess(request(), 'wrong', EXPECTED)).toBe(false);
  });

  // Regression: /api/vitals used to be open when STATS_TOKEN was unset
  it('fails closed when STATS_TOKEN is not configured', () => {
    expect(hasStatsAccess(request({ Authorization: 'Bearer anything' }), 'anything', undefined)).toBe(false);
  });

  it('scopes the stats cookie to the whole site so the API receives it', () => {
    expect(STATS_TOKEN_COOKIE.path).toBe('/');
  });
});
