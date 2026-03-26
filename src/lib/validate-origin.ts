/**
 * Shared origin validation for CSRF protection
 *
 * Validates that the request origin matches expected hosts.
 * Used by AI tool endpoints and feature-toggles.
 */

/**
 * Validates that the request origin matches the expected host (CSRF protection)
 * Returns true if valid, false if CSRF check fails
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // If no origin header (same-origin request or non-browser), allow
  if (!origin) return true;

  // Extract hostname from origin (e.g., "https://fyrk.no" -> "fyrk.no")
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;

    // Check if origin matches host
    if (host && originHost === host) return true;

    // Allow localhost only in development
    if (import.meta.env.DEV && (originHost.startsWith('localhost') || originHost.startsWith('127.0.0.1'))) {
      return true;
    }

    // Allow fyrk.no domain (production)
    if (originHost === 'fyrk.no' || originHost.endsWith('.fyrk.no')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
