import { test, expect } from '@playwright/test';

test.describe('All Pages Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Fyrk/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('OKR-sjekken page loads correctly', async ({ page }) => {
    await page.goto('/okr-sjekken');
    await expect(page).toHaveTitle(/OKR/);
    await expect(page.locator('main')).toBeVisible();
    // OKR page has a heading instead of nav
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('homepage has accessible navigation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
    await expect(skipLink).toBeVisible();
  });

  test('OKR-sjekken has accessible navigation', async ({ page }) => {
    await page.goto('/okr-sjekken');
    const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
    await expect(skipLink).toBeVisible();
  });
});

