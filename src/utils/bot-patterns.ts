/**
 * Common bot/crawler user agent patterns
 * Shared between server-side and client-side tracking exclusion
 */
export const BOT_PATTERNS = [
  // Search engine bots
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'sogou', 'exabot', 'facebot', 'ia_archiver',
  // Social media crawlers
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'discordbot', 'slackbot',
  // SEO tools
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming frog',
  // Generic bot indicators
  'bot', 'crawler', 'spider', 'crawling', 'feedfetcher',
  // Monitoring/uptime
  'uptimerobot', 'pingdom', 'statuscake', 'site24x7',
  // Other automated tools
  'curl', 'wget', 'python-requests', 'go-http-client', 'java/', 'httpunit',
  'libwww', 'httplib', 'axios', 'node-fetch',
] as const;

/** Automated browser user agent patterns */
export const AUTOMATED_BROWSER_PATTERNS = [
  'playwright', 'puppeteer', 'headlesschrome', 'cypress', 'selenium',
] as const;

/**
 * Check if user agent looks like a bot
 */
export function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

/**
 * Check if user agent looks like an automated browser
 */
export function isAutomatedBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return AUTOMATED_BROWSER_PATTERNS.some(pattern => ua.includes(pattern));
}
