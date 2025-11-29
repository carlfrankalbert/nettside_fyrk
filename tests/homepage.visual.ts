/**
 * Visual Regression Tests - Homepage
 * 
 * These tests verify appearance (element looks correct) against approved baselines.
 * Baseline screenshots represent the approved design.
 * Any visual deviation from baseline must be reviewed and either fixed or approved as new baseline.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Regression', () => {
  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('hero section visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hero = page.locator('section').first();
    await expect(hero).toHaveScreenshot('hero-section.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('services section visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const servicesSection = page.getByRole('heading', { name: /Hva vi tilbyr/i }).locator('..').locator('..');
    await expect(servicesSection).toHaveScreenshot('services-section.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

