/**
 * Server-side tracking exclusion utility
 * Provides functions to detect and exclude automated/test traffic
 */

import { isBot, isAutomatedBrowser } from './bot-patterns';
import { isDatacenterNetwork, type RequestGeo } from './visitor-dimensions';

/**
 * Check if a request should be excluded from tracking
 * Detects automated browsers, test traffic, and bots
 */
export function shouldExcludeRequest(request: Request): boolean {
  // The Worker's workers.dev URL and its per-branch preview URLs share the
  // production KV namespace with fyrk.no; only the real site counts
  if (isNonProductionHost(request)) {
    return true;
  }

  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // Exclude if no user agent (likely automated)
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  // Exclude automated browsers (Playwright, Puppeteer, etc.)
  if (isAutomatedBrowser(userAgent)) {
    return true;
  }

  // Exclude bots and crawlers
  if (isBot(userAgent)) {
    return true;
  }

  // Exclude cloud, hosting and VPN networks: real visitors rarely browse from these
  if (isDatacenterRequest(request)) {
    return true;
  }

  // Check for custom header that tests can set
  const excludeHeader = request.headers.get('x-exclude-from-stats');
  if (excludeHeader === 'true') {
    return true;
  }

  return false;
}

function isNonProductionHost(request: Request): boolean {
  try {
    return new URL(request.url).hostname.endsWith('.workers.dev');
  } catch {
    return false;
  }
}

function isDatacenterRequest(request: Request): boolean {
  const organization = (request as Request & { cf?: RequestGeo }).cf?.asOrganization;
  return typeof organization === 'string' && isDatacenterNetwork(organization);
}
