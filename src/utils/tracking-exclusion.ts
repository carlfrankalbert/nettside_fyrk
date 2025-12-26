/**
 * Server-side tracking exclusion utility
 * Provides functions to detect and exclude automated/test traffic
 */

/**
 * Check if a request should be excluded from tracking
 * Detects automated browsers, test traffic, and bots
 */
export function shouldExcludeRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // Exclude automated browsers (Playwright, Puppeteer, etc.)
  if (
    userAgent.includes('playwright') ||
    userAgent.includes('puppeteer') ||
    userAgent.includes('headlesschrome') ||
    userAgent.includes('cypress') ||
    userAgent.includes('selenium')
  ) {
    return true;
  }

  // Check for custom header that tests can set
  const excludeHeader = request.headers.get('x-exclude-from-stats');
  if (excludeHeader === 'true') {
    return true;
  }

  return false;
}
