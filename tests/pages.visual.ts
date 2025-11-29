import { test, expect } from '@playwright/test';

test.describe('All Pages Visual Regression', () => {
  const pages = [
    { path: '/', name: 'homepage' },
    { path: '/om', name: 'about' },
    { path: '/kontakt', name: 'contact' },
    { path: '/blogg', name: 'blog' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page visual snapshot`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${pageInfo.name}-page.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

