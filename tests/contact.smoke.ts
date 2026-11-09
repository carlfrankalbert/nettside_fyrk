import { test, expect } from '@playwright/test';

test.describe('Contact Smoke Tests', () => {
  test('footer email link opens mail client', async ({ page }) => {
    await page.goto('/');

    const emailLink = page.getByTestId('footer-email');
    await expect(emailLink).toBeVisible();
    const href = await emailLink.getAttribute('href');
    expect(href).toMatch(/^mailto:/);
    expect(href).toContain('@fyrk.no');
  });

  test('footer has LinkedIn link that opens externally', async ({ page }) => {
    await page.goto('/');

    const linkedinLink = page.getByTestId('footer-link-linkedin');
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute('target', '_blank');
    await expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/company/fyrk/');
  });
});
