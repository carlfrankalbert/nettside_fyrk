/**
 * Shared token verification helpers for the token-gated routes (stats,
 * feature-toggles, beta, vitals). Centralising this keeps every gate on the
 * same constant-time comparison instead of scattering plain `===`/`!==` checks.
 */

/**
 * Constant-time string comparison so a secret token can't be recovered by
 * measuring response timing. Returns false when either value is missing.
 *
 * The loop always runs for the full length of `expected` and folds a length
 * mismatch into the diff, so it never short-circuits on the first differing
 * byte or on unequal lengths.
 */
export function verifyToken(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;

  const enc = new TextEncoder();
  const ab = enc.encode(provided);
  const bb = enc.encode(expected);

  let diff = ab.length ^ bb.length;
  for (let i = 0; i < bb.length; i++) {
    diff |= bb[i] ^ (ab[i % ab.length] ?? 0);
  }
  return diff === 0;
}

/**
 * Extract a Bearer token from a request's Authorization header.
 * Returns null when the header is absent or not a Bearer scheme.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
