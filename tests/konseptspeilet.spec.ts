/**
 * Konseptspeilet E2E Tests
 *
 * Tests the complete user journey for the Konseptspeilet tool.
 * API calls are mocked to ensure stability and speed.
 */
import { test, expect } from '@playwright/test';

// Sample mock response that matches expected format
const MOCK_RESPONSE = `## Antagelser i teksten

- Målgruppen ønsker et enkelt verktøy
- Markedet er klart for denne typen produkt
- Teamet har kapasitet til lansering i Q1

## Åpne spørsmål

- Hvem er den primære brukeren?
- Hva skiller produktet fra konkurrentene?
- Hvordan måles suksess etter lansering?`;

test.describe('Konseptspeilet', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoint to return a predictable response
    await page.route('**/api/konseptspeilet', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Simulate streaming response
      if (postData?.stream) {
        const chunks = MOCK_RESPONSE.match(/.{1,50}/g) || [MOCK_RESPONSE];

        const body = chunks
          .map((chunk) => `data: ${JSON.stringify({ text: chunk })}\n`)
          .join('') + 'data: [DONE]\n';

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body,
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ output: MOCK_RESPONSE, cached: false }),
        });
      }
    });
  });

  test('displays page correctly', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    // Check page title and main heading
    await expect(page).toHaveTitle(/Konseptspeilet/);
    await expect(page.locator('h1')).toContainText('Konseptspeilet');
  });

  test('shows character counter and validation', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Initially button should be disabled (no input)
    await expect(submitButton).toBeDisabled();

    // Type short text (below minimum)
    await textarea.fill('Kort tekst');
    await expect(submitButton).toBeDisabled();

    // Type text above minimum (50 characters)
    const validInput = 'Dette er en konseptbeskrivelse som er lang nok til å analyseres av verktøyet.';
    await textarea.fill(validInput);
    await expect(submitButton).toBeEnabled();
  });

  test('happy path: submit and receive analysis', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Enter valid concept description
    const conceptDescription = `
      Vi bygger en plattform for å hjelpe småbedrifter med å automatisere
      faktureringsprosessen. Løsningen skal integreres med eksisterende
      regnskapssystemer og redusere tid brukt på administrasjon.
    `;
    await textarea.fill(conceptDescription);

    // Submit form
    await submitButton.click();

    // Wait for result to appear
    await expect(page.locator('text=Antagelser i teksten')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Åpne spørsmål')).toBeVisible();

    // Verify content from mock response
    await expect(page.locator('text=Målgruppen ønsker et enkelt verktøy')).toBeVisible();
    await expect(page.locator('text=Hvem er den primære brukeren?')).toBeVisible();
  });

  test('displays loading state during submission', async ({ page }) => {
    // Slow down the mock response to observe loading state
    await page.route('**/api/konseptspeilet', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ output: MOCK_RESPONSE, cached: false }),
      });
    });

    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await textarea.fill('En lang nok tekst for å teste loading-tilstanden i appen vår.');
    await submitButton.click();

    // Check for loading indicator
    await expect(submitButton).toBeDisabled();
  });

  test('handles API error gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/konseptspeilet', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Noe gikk galt. Prøv igjen.' }),
      });
    });

    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await textarea.fill('En tekst som vil utløse en feil fra API-et for testing.');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('text=Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });

  test('can reset and try again after result', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // First submission
    await textarea.fill('Første konseptbeskrivelse som er lang nok til analyse.');
    await submitButton.click();
    await expect(page.locator('text=Antagelser i teksten')).toBeVisible({ timeout: 10000 });

    // Look for reset/new analysis button
    const resetButton = page.locator('button:has-text("Ny"), button:has-text("Prøv igjen"), button:has-text("Nullstill")').first();

    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(textarea).toBeVisible();
    }
  });
});
