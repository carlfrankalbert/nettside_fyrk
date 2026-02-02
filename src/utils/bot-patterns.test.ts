import { describe, it, expect } from 'vitest';
import { isBot, isAutomatedBrowser } from './bot-patterns';

describe('isBot', () => {
  it('detects Googlebot', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
  });

  it('detects Bingbot', () => {
    expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
  });

  it('detects curl', () => {
    expect(isBot('curl/7.88.1')).toBe(true);
  });

  it('detects Python requests', () => {
    expect(isBot('python-requests/2.31.0')).toBe(true);
  });

  it('detects UptimeRobot', () => {
    expect(isBot('UptimeRobot/2.0')).toBe(true);
  });

  it('returns false for Chrome', () => {
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe(false);
  });

  it('returns false for Safari', () => {
    expect(isBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isBot('GOOGLEBOT/2.1')).toBe(true);
  });
});

describe('isAutomatedBrowser', () => {
  it('detects Playwright', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 Playwright/1.40.0')).toBe(true);
  });

  it('detects Puppeteer', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 HeadlessChrome/120.0 Puppeteer')).toBe(true);
  });

  it('detects HeadlessChrome', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 HeadlessChrome/120.0')).toBe(true);
  });

  it('detects Cypress', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 Cypress/13.0')).toBe(true);
  });

  it('detects Selenium', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 Selenium/4.0')).toBe(true);
  });

  it('returns false for normal Chrome', () => {
    expect(isAutomatedBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')).toBe(false);
  });
});
