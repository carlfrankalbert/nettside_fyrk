import { test, expect } from '@playwright/test';

test.describe('All Pages Smoke Tests', () => {
  const pages = [
    { path: '/', title: /Fyrk/ },
    { path: '/om', title: /Om oss/ },
    { path: '/kontakt', title: /Kontakt/ },
    { path: '/blogg', title: /Blogg/ },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.path} loads correctly`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  }

  test('all pages have accessible navigation', async ({ page }) => {
    const pages = ['/', '/om', '/kontakt', '/blogg'];
    
    for (const path of pages) {
      await page.goto(path);
      const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
      await expect(skipLink).toBeVisible();
    }
  });
});

