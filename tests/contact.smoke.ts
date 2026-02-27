import { test, expect } from '@playwright/test';

// Smoke tests require a baseURL (CI or explicit PLAYWRIGHT_TEST_BASE_URL)
const hasBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL || !!process.env.CI;

test.describe('Contact Smoke Tests', () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(!hasBaseUrl, 'Smoke tests only run in CI or with PLAYWRIGHT_TEST_BASE_URL set');
  });

  test('footer has email link', async ({ page }) => {
    await page.goto('/');

    const emailLink = page.locator('footer').getByRole('link', { name: /hei@fyrk\.no/i });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:hei@fyrk.no');
  });

  test('footer has LinkedIn link', async ({ page }) => {
    await page.goto('/');

    const linkedinLink = page.locator('footer').getByRole('link', { name: /LinkedIn/i });
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
  });

  test('header has contact CTA', async ({ page, viewport }) => {
    await page.goto('/');

    // On mobile the CTA is inside the hamburger menu — skip visibility check
    if (viewport && viewport.width < 768) {
      const ctaLink = page.getByRole('link', { name: /Ta kontakt/i }).first();
      await expect(ctaLink).toHaveAttribute('href', 'mailto:hei@fyrk.no');
    } else {
      const ctaLink = page.getByRole('link', { name: /Ta kontakt/i }).first();
      await expect(ctaLink).toBeVisible();
      await expect(ctaLink).toHaveAttribute('href', 'mailto:hei@fyrk.no');
    }
  });
});
