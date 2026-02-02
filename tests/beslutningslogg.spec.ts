/**
 * Beslutningslogg E2E Tests
 *
 * Tests the complete user journey for the Beslutningslogg tool.
 * No API mocking needed — this is a purely client-side tool.
 */
import { test, expect } from '@playwright/test';

test.describe('Beslutningslogg', () => {
  test('displays page correctly', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Dokumenter beslutninger');
    await expect(page.locator('#beslutning-input')).toBeVisible();
  });

  test('disables button when beslutning is too short', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });

    // Initially disabled
    await expect(generateButton).toBeDisabled();

    // Short text — still disabled
    await textarea.fill('Kort');
    await expect(generateButton).toBeDisabled();

    // 20+ chars — enabled
    await textarea.fill('Vi har besluttet å bytte leverandør for skyinfrastruktur');
    await expect(generateButton).toBeEnabled();
  });

  test('happy path: generate markdown preview', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });

    await textarea.fill('Vi har besluttet å bytte fra AWS til Google Cloud');
    await generateButton.click();

    // Preview should appear
    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).toBeVisible();
    await expect(page.locator('text=Vi har besluttet å bytte fra AWS til Google Cloud')).toBeVisible();
  });

  test('includes all optional fields in preview', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    // Fill all fields
    await page.locator('#beslutning-input').fill('Vi har besluttet å bytte fra AWS til Google Cloud');
    await page.locator('#deltakere-input').fill('Produktteam, CTO');
    await page.locator('#antakelser-input').fill('Kostnadene vil gå ned\nMigrasjonen tar under 3 mnd');
    await page.locator('#usikkerhet-input').fill('Team-kompetanse på GCP er lav');

    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });
    await generateButton.click();

    // Verify all sections in preview
    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).toBeVisible();
    await expect(page.locator('text=Produktteam, CTO')).toBeVisible();
    await expect(page.locator('text=Kostnadene vil gå ned')).toBeVisible();
    await expect(page.locator('text=Team-kompetanse på GCP er lav')).toBeVisible();
  });

  test('copy button shows feedback', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    await page.locator('#beslutning-input').fill('Vi har besluttet å bytte fra AWS til Google Cloud');
    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });
    await generateButton.click();

    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).toBeVisible();

    // Click copy button
    const copyButton = page.getByRole('button', { name: /Kopier Markdown/i });
    await copyButton.click();

    // Should show copied feedback
    await expect(page.locator('text=Kopiert!')).toBeVisible();
  });

  test('edit returns to form with values preserved', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    const beslutningText = 'Vi har besluttet å bytte fra AWS til Google Cloud';
    await page.locator('#beslutning-input').fill(beslutningText);

    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });
    await generateButton.click();
    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).toBeVisible();

    // Click edit
    await page.getByRole('button', { name: /Rediger/i }).click();

    // Textarea should be visible with original value
    await expect(page.locator('#beslutning-input')).toBeVisible();
    await expect(page.locator('#beslutning-input')).toHaveValue(beslutningText);
  });

  test('reset clears all fields', async ({ page }) => {
    await page.goto('/beslutningslogg');
    await page.waitForLoadState('networkidle');

    await page.locator('#beslutning-input').fill('Vi har besluttet å bytte fra AWS til Google Cloud');
    await page.locator('#deltakere-input').fill('Produktteam');

    const generateButton = page.locator('#main-content').getByRole('button', { name: /Lag Markdown/i });
    await generateButton.click();
    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).toBeVisible();

    // Click reset
    await page.getByRole('button', { name: /Start på nytt/i }).click();

    // All fields should be cleared, preview hidden
    await expect(page.locator('#beslutning-input')).toHaveValue('');
    await expect(page.locator('#deltakere-input')).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'Forhåndsvisning' })).not.toBeVisible();
  });
});
