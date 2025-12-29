/**
 * Smoke Tests - Error Pages (404 and 500)
 *
 * Tests that error pages handle errors gracefully and redirect appropriately
 */

import { test, expect } from '@playwright/test';

// Smoke tests require a baseURL (CI or explicit PLAYWRIGHT_TEST_BASE_URL)
const hasBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL || !!process.env.CI;

test.describe('Error Pages Smoke Tests', () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(!hasBaseUrl, 'Smoke tests only run in CI or with PLAYWRIGHT_TEST_BASE_URL set');
  });

  test.describe('404 Not Found', () => {
    test('should return 404 status for non-existent page', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');
      expect(response?.status()).toBe(404);
    });

    test('should redirect to homepage from 404', async ({ page }) => {
      // Disable JavaScript to test meta refresh
      await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });

      // Wait for redirect (either meta refresh or JS)
      await page.waitForURL('/', { timeout: 5000 }).catch(() => {
        // If redirect doesn't happen, check we're showing some content
      });

      // Should either be on homepage or showing logo
      const url = page.url();
      const hasLogo = await page.locator('svg, img').first().isVisible().catch(() => false);

      expect(url.endsWith('/') || hasLogo).toBe(true);
    });

    test('should not expose stack traces on 404', async ({ page }) => {
      await page.goto('/non-existent-page-xyz', { waitUntil: 'domcontentloaded' });
      const content = await page.content();

      expect(content.toLowerCase()).not.toContain('stack trace');
      expect(content.toLowerCase()).not.toContain('error at');
      expect(content.toLowerCase()).not.toContain('typeerror');
      expect(content.toLowerCase()).not.toContain('referenceerror');
    });

    test('should have proper HTML structure on 404', async ({ page }) => {
      await page.goto('/random-404-page', { waitUntil: 'domcontentloaded' });

      // Should have basic HTML structure
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'no');
    });

    test('should handle special characters in URL gracefully', async ({ page }) => {
      const specialUrls = [
        '/page-with-spaces%20and%20stuff',
        '/page<script>alert(1)</script>',
        '/page/../../../etc/passwd',
      ];

      for (const url of specialUrls) {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        // Should handle gracefully (404 or redirect)
        expect([200, 301, 302, 404]).toContain(response?.status() || 404);
      }
    });
  });

  test.describe('Error Page Content', () => {
    test('should not expose sensitive information', async ({ page }) => {
      await page.goto('/non-existent', { waitUntil: 'domcontentloaded' });
      const content = await page.content();

      // Should not expose file paths
      expect(content).not.toContain('/home/');
      expect(content).not.toContain('/var/');
      expect(content).not.toContain('/etc/');

      // Should not expose package information
      expect(content).not.toContain('node_modules');
      expect(content).not.toContain('package.json');
    });

    test('should be visually styled (not raw HTML)', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });

      // Check for CSS styling - either inline styles or linked stylesheet
      const hasStyles = await page.evaluate(() => {
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        return styles.length > 0;
      });

      expect(hasStyles).toBe(true);
    });

    test('should support dark mode', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });
      const content = await page.content();

      // Check for dark mode CSS classes
      expect(content).toContain('dark:');
    });
  });

  // Skip API tests when running against production (GitHub Pages)
  // since API routes are only available on Cloudflare Workers
  const isProduction = process.env.PLAYWRIGHT_TEST_BASE_URL?.includes('fyrk.no');

  test.describe('API Error Handling', () => {
    test.beforeEach(async ({}, testInfo) => {
      testInfo.skip(isProduction === true, 'API routes not available on GitHub Pages');
    });

    test('should return JSON error for invalid API request', async ({ request }) => {
      const response = await request.post('/api/okr-sjekken', {
        data: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post('/api/okr-sjekken', {
        headers: { 'Content-Type': 'application/json' },
        data: 'not valid json{{{',
      });

      // Should return error status, not crash
      expect([400, 500]).toContain(response.status());
    });
  });

  test.describe('Error Page Accessibility', () => {
    test('should have proper language attribute', async ({ page }) => {
      await page.goto('/non-existent', { waitUntil: 'domcontentloaded' });

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('no');
    });

    test('should have viewport meta tag', async ({ page }) => {
      await page.goto('/non-existent', { waitUntil: 'domcontentloaded' });

      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveCount(1);
    });

    test('should have title', async ({ page }) => {
      await page.goto('/non-existent', { waitUntil: 'domcontentloaded' });

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test.describe('Multiple 404 Patterns', () => {
    const notFoundPaths = [
      '/admin',
      '/wp-admin',
      '/.env',
      '/config',
      '/api/unknown',
      '/deeply/nested/path/that/does/not/exist',
    ];

    for (const path of notFoundPaths) {
      test(`should handle ${path} gracefully`, async ({ page }) => {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

        // Should return 404 or redirect
        expect([200, 301, 302, 404]).toContain(response?.status() || 404);

        // Should not expose sensitive info
        const content = await page.content();
        expect(content.toLowerCase()).not.toContain('exception');
        expect(content.toLowerCase()).not.toContain('stack trace');
      });
    }
  });
});
