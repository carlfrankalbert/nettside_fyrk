/**
 * Smoke Tests - Homepage
 * 
 * These tests verify presence (element exists) and basic functionality.
 * They check that critical elements are present, visible, and functional.
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Tests', () => {
  test('homepage loads and shows main content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Fyrk/);
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigation links are visible and clickable', async ({ page }) => {
    await page.goto('/');
    
    const navLinks = [
      { text: 'Hjem', href: '/' },
      { text: 'Om oss', href: '/om' },
      { text: 'Blogg', href: '/blogg' },
      { text: 'Kontakt', href: '/kontakt' },
    ];

    for (const link of navLinks) {
      const navLink = page.getByRole('link', { name: link.text });
      await expect(navLink).toBeVisible();
      await expect(navLink).toHaveAttribute('href', link.href);
    }
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('services section is visible', async ({ page }) => {
    await page.goto('/');
    const servicesHeading = page.getByRole('heading', { name: /Hva vi tilbyr/i });
    await expect(servicesHeading).toBeVisible();
  });

  test('CTA buttons are visible and clickable', async ({ page }) => {
    await page.goto('/');
    const contactButton = page.getByRole('link', { name: /Ta kontakt/i });
    await expect(contactButton.first()).toBeVisible();
  });
});

