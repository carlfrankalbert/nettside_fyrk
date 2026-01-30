import { test, expect } from '@playwright/test';

// Smoke tests require a baseURL (CI or explicit PLAYWRIGHT_TEST_BASE_URL)
const hasBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL || !!process.env.CI;

test.describe('Contact Section Smoke Tests', () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(!hasBaseUrl, 'Smoke tests only run in CI or with PLAYWRIGHT_TEST_BASE_URL set');
  });

  test('homepage contact section is accessible', async ({ page }) => {
    await page.goto('/#kontakt');

    // Check the contact section heading
    await expect(page.getByRole('heading', { name: /Ta kontakt/i })).toBeVisible();
  });

  test('contact section has email link', async ({ page }) => {
    await page.goto('/#kontakt');

    const emailLink = page.getByRole('link', { name: /Ta kontakt/i }).first();
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:hei@fyrk.no');
  });

  test('contact section has LinkedIn link', async ({ page }) => {
    await page.goto('/#kontakt');

    const linkedinLink = page.getByRole('link', { name: /LinkedIn/i }).first();
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
  });
});

