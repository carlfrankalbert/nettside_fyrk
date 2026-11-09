import { test, expect } from '@playwright/test';

test.describe('All Pages Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FYRK/i);
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

  test('homepage presents tools, insight and about sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Verktøyene' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Innsikt' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Om FYRK' })).toBeVisible();
    // Hero CTA jumps to the tool list on the same page
    await expect(page.locator('#verktoy')).toBeAttached();
  });

  test('homepage has no consultancy sales content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href*="/konsulenter"]')).toHaveCount(0);
    await expect(page.locator('#kontakt')).toHaveCount(0);
    await expect(page.getByText(/interim produktleder|bemanningsforetak/i)).toHaveCount(0);
  });

  test('homepage has accessible navigation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
    // Skip link uses sr-only class (hidden until focused) per WCAG guidelines
    await expect(skipLink).toBeAttached();
    // Verify it becomes visible when focused
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('OKR-sjekken has accessible navigation', async ({ page }) => {
    await page.goto('/okr-sjekken');
    const skipLink = page.getByRole('link', { name: /Hopp til hovedinnhold/i });
    // Skip link uses sr-only class (hidden until focused) per WCAG guidelines
    await expect(skipLink).toBeAttached();
    // Verify it becomes visible when focused
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });
});

