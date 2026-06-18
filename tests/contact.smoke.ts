import { test, expect } from '@playwright/test';

// Smoke tests require a baseURL (CI or explicit PLAYWRIGHT_TEST_BASE_URL)
const hasBaseUrl = !!process.env.PLAYWRIGHT_TEST_BASE_URL || !!process.env.CI;

test.describe('Contact Smoke Tests', () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(!hasBaseUrl, 'Smoke tests only run in CI or with PLAYWRIGHT_TEST_BASE_URL set');
  });

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
    const href = await linkedinLink.getAttribute('href');
    expect(href).toContain('linkedin.com');
  });

  test('header contact CTA targets the contact section', async ({ page, viewport }) => {
    await page.goto('/');

    // On mobile the CTA lives inside the hamburger menu
    const isMobile = !!(viewport && viewport.width < 768);
    if (isMobile) {
      await page.getByLabel('Åpne meny').click();
    }

    const ctaTestId = isMobile ? 'header-contact-cta-mobile' : 'header-contact-cta';
    const ctaLink = page.getByTestId(ctaTestId);
    await expect(ctaLink).toBeVisible();

    const href = await ctaLink.getAttribute('href');
    expect(href).toContain('#kontakt');
  });
});
