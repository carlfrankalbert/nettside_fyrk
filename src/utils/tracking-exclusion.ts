/**
 * Server-side tracking exclusion utility
 * Provides functions to detect and exclude automated/test traffic
 */

/**
 * Common bot/crawler user agent patterns
 */
const BOT_PATTERNS = [
  // Search engine bots
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'sogou', 'exabot', 'facebot', 'ia_archiver',
  // Social media crawlers
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'discordbot', 'slackbot',
  // SEO tools
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming frog',
  // Generic bot indicators
  'bot', 'crawler', 'spider', 'crawling', 'feedfetcher', 'slurp',
  // Monitoring/uptime
  'uptimerobot', 'pingdom', 'statuscake', 'site24x7',
  // Other automated tools
  'curl', 'wget', 'python-requests', 'go-http-client', 'java/', 'httpunit',
  'libwww', 'httplib', 'axios', 'node-fetch',
];

/**
 * Check if user agent looks like a bot
 */
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

/**
 * Check if a request should be excluded from tracking
 * Detects automated browsers, test traffic, and bots
 */
export function shouldExcludeRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // Exclude if no user agent (likely automated)
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

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

  // Exclude bots and crawlers
  if (isBot(userAgent)) {
    return true;
  }

  // Check for custom header that tests can set
  const excludeHeader = request.headers.get('x-exclude-from-stats');
  if (excludeHeader === 'true') {
    return true;
  }

  return false;
}
