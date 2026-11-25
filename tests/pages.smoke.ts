import { test, expect } from '@playwright/test';

const TOOL_PAGES = [
  '/okr-sjekken',
  '/konseptspeilet',
  '/antakelseskart',
  '/beslutningslogg',
  '/verktoy/pre-mortem',
];

const CONTENT_PAGES = ['/verktoy', '/innsikt', '/personvern', '/vilkar'];

test.describe('Pages', () => {
  test('homepage presents tools, insight and about', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FYRK/i);
    await expect(page.getByRole('heading', { level: 2, name: 'Verktøyene' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Innsikt' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Om FYRK' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('skip link becomes visible on focus', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  for (const path of [...TOOL_PAGES, ...CONTENT_PAGES]) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBe(true);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    });
  }

  for (const path of TOOL_PAGES) {
    test(`${path} has an input form`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('#main-content textarea, #main-content input').first()).toBeVisible();
    });
  }
});

test.describe('API', () => {
  test('rejects invalid input with a JSON error', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', { data: {} });
    expect(response.status()).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });
});
