/**
 * Client-side tracking exclusion utility
 * Excludes certain visitors from analytics:
 * - Developer/owner (via localStorage flag)
 * - Automated tests (Playwright, headless browsers)
 * - Bots and crawlers
 */

import { isBot, isAutomatedBrowser } from '../utils/bot-patterns';

const EXCLUSION_KEY = 'fyrk_exclude_from_stats';

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
    if (navigator.webdriver) {
      return true;
    }

    const ua = navigator.userAgent;
    if (isAutomatedBrowser(ua) || isBot(ua)) {
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
