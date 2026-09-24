/**
 * Token gates for internal pages (/stats, /feature-toggles) and the /beta invite.
 *
 * A token arrives once in the URL (a bookmark or a shared link), is exchanged for
 * an httpOnly cookie, and the browser is redirected to the same URL without it.
 * The secret then stops travelling in URLs, browser history and request logs.
 */
import { verifyToken } from '../utils/verify-token';

export interface CookieConfig {
  name: string;
  /** Cookie Path. Must cover every route that reads the cookie. */
  path: string;
  maxAgeSeconds: number;
}

export const STATS_TOKEN_COOKIE: CookieConfig = {
  name: 'stats_token',
  path: '/stats',
  maxAgeSeconds: 60 * 60 * 8,
};

/** Path `/` so both the page and /api/feature-toggles receive it. */
export const FEATURE_TOGGLES_TOKEN_COOKIE: CookieConfig = {
  name: 'feature_toggles_token',
  path: '/',
  maxAgeSeconds: 60 * 60 * 8,
};

export type TokenGate =
  | { status: 'granted' }
  | { status: 'redirect'; response: Response }
  | { status: 'not-configured' }
  | { status: 'missing' }
  /** `clearCookie`: the cookie holds a stale token (e.g. after rotation). */
  | { status: 'mismatch'; clearCookie: boolean };

/**
 * SameSite=Lax, not Strict: the first visit often arrives from another site (a
 * bookmark, a chat link), and the browser must send the freshly set cookie on
 * the redirect that follows.
 */
export function serializeCookie(value: string, config: CookieConfig): string {
  return [
    `${config.name}=${encodeURIComponent(value)}`,
    `Path=${config.path}`,
    `Max-Age=${config.maxAgeSeconds}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
}

/**
 * 302 with Set-Cookie written on the response itself: the Cloudflare adapter
 * can drop Astro.cookies on redirect responses.
 */
export function redirectWithCookie(location: string, cookie: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
}

/** Path and query of `url` with the `token` parameter removed. */
export function withoutToken(url: URL): string {
  const clean = new URL(url);
  clean.searchParams.delete('token');
  return clean.pathname + clean.search;
}

/**
 * Decide access from a `?token=` query parameter or a previously set cookie.
 * A valid query token is never rendered with: it is exchanged for the cookie
 * via a redirect to the same URL without it.
 */
export function resolveTokenGate(
  url: URL,
  cookieToken: string | null | undefined,
  expectedToken: string | undefined,
  config: CookieConfig
): TokenGate {
  if (!expectedToken) return { status: 'not-configured' };

  const queryToken = url.searchParams.get('token');
  const providedToken = queryToken ?? cookieToken ?? null;
  if (!providedToken) return { status: 'missing' };

  if (!verifyToken(providedToken, expectedToken)) {
    return {
      status: 'mismatch',
      clearCookie: !!cookieToken && !verifyToken(cookieToken, expectedToken),
    };
  }

  if (queryToken) {
    return {
      status: 'redirect',
      response: redirectWithCookie(withoutToken(url), serializeCookie(queryToken, config)),
    };
  }

  return { status: 'granted' };
}
