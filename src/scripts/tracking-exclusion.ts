/**
 * Tracking exclusion utility
 * Provides functions to exclude certain visitors from analytics:
 * - Developer/owner (via localStorage flag)
 * - Automated tests (Playwright, headless browsers)
 * - Bots and crawlers
 */

const EXCLUSION_KEY = 'fyrk_exclude_from_stats';

/**
 * Common bot/crawler user agent patterns (subset - most bots don't run JS)
 */
const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'crawling',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot',
];

/**
 * Check if user agent looks like a bot
 */
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

/**
 * Check if tracking should be skipped for this visitor
 */
export function shouldExcludeFromTracking(): boolean {
  // Check localStorage flag (for developer exclusion)
  if (typeof localStorage !== 'undefined') {
    const excluded = localStorage.getItem(EXCLUSION_KEY);
    if (excluded === 'true') {
      return true;
    }
  }

  // Check for automated browsers (Playwright, Puppeteer, etc.)
  if (typeof navigator !== 'undefined') {
    // navigator.webdriver is true for automated browsers
    if (navigator.webdriver) {
      return true;
    }

    const ua = navigator.userAgent.toLowerCase();

    // Check user agent for common test/automation indicators
    if (
      ua.includes('playwright') ||
      ua.includes('puppeteer') ||
      ua.includes('headlesschrome') ||
      ua.includes('cypress')
    ) {
      return true;
    }

    // Check for bots (rare in JS context, but just in case)
    if (isBot(ua)) {
      return true;
    }
  }

  return false;
}

/**
 * Enable tracking exclusion for this browser
 * Call this from the console: fyrk.excludeFromStats()
 */
export function excludeFromStats(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(EXCLUSION_KEY, 'true');
    console.log('✓ You are now excluded from Fyrk statistics');
  }
}

/**
 * Disable tracking exclusion for this browser
 * Call this from the console: fyrk.includeInStats()
 */
export function includeInStats(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(EXCLUSION_KEY);
    console.log('✓ You are now included in Fyrk statistics');
  }
}

/**
 * Check current exclusion status
 * Call this from the console: fyrk.isExcluded()
 */
export function isExcluded(): boolean {
  const excluded = shouldExcludeFromTracking();
  console.log(excluded ? '✗ You are excluded from stats' : '✓ You are included in stats');
  return excluded;
}

/**
 * Initialize window.fyrk helpers for console access
 * Must be called from page scripts to expose the helper functions
 */
export function initTrackingHelpers(): void {
  if (typeof window !== 'undefined') {
    (window as Window & { fyrk?: Record<string, unknown> }).fyrk = {
      excludeFromStats,
      includeInStats,
      isExcluded,
    };
  }
}
