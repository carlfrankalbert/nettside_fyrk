import { test, expect } from '@playwright/test';

test.describe('Contact Page Smoke Tests', () => {
  test('contact page loads correctly', async ({ page }) => {
    await page.goto('/kontakt');
    await expect(page).toHaveTitle(/Kontakt/);
    await expect(page.getByRole('heading', { level: 1, name: /Kontakt/i })).toBeVisible();
  });

  test('contact form is accessible and has required fields', async ({ page }) => {
    await page.goto('/kontakt');
    
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check required fields
    const nameField = page.getByLabel(/Navn/i);
    await expect(nameField).toBeVisible();
    await expect(nameField).toHaveAttribute('required');

    const emailField = page.getByLabel(/E-post/i);
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('required');
    await expect(emailField).toHaveAttribute('type', 'email');

    const messageField = page.getByLabel(/Melding/i);
    await expect(messageField).toBeVisible();
    await expect(messageField).toHaveAttribute('required');

    const consentCheckbox = page.getByLabel(/samtykker/i);
    await expect(consentCheckbox).toBeVisible();
    await expect(consentCheckbox).toHaveAttribute('required');
  });

  test('form submission button is visible', async ({ page }) => {
    await page.goto('/kontakt');
    const submitButton = page.getByRole('button', { name: /Send melding/i });
    await expect(submitButton).toBeVisible();
  });
});

