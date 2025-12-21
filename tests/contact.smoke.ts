import { test, expect } from '@playwright/test';

test.describe('Contact Section Smoke Tests', () => {
  test('homepage contact section is accessible', async ({ page }) => {
    await page.goto('/#kontakt');

    // Check the contact section heading
    await expect(page.getByRole('heading', { name: /Ta kontakt/i })).toBeVisible();
  });

  test('contact section has email link', async ({ page }) => {
    await page.goto('/#kontakt');

    const emailLink = page.getByRole('link', { name: /hei@fyrk\.no/i });
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

