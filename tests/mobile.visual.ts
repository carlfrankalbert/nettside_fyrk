/**
 * Visual Regression Tests - Mobile Layouts
 * 
 * These tests verify appearance (element looks correct) against approved baselines.
 * Baseline screenshots represent the approved design.
 * Any visual deviation from baseline must be reviewed and either fixed or approved as new baseline.
 */

import { test, expect } from '@playwright/test';

test.describe('Mobile Visual Regression - UX Designer Perspective', () => {
  test('homepage mobile visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('homepage hero section mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hero = page.locator('section').first();
    await expect(hero).toHaveScreenshot('hero-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('services section mobile layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const servicesSection = page.getByRole('heading', { name: /Hva vi tilbyr/i }).locator('..').locator('..');
    await expect(servicesSection).toHaveScreenshot('services-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('navigation mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('navigation-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('contact page mobile', async ({ page }) => {
    await page.goto('/kontakt');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('contact-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('contact form mobile layout', async ({ page }) => {
    await page.goto('/kontakt');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('contact-form-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('about page mobile', async ({ page }) => {
    await page.goto('/om');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('about-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});

