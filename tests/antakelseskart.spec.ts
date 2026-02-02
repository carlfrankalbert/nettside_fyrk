/**
 * Antakelseskart E2E Tests
 *
 * Tests the complete user journey for the Antakelseskart tool.
 * API calls are mocked to ensure stability and speed.
 */
import { test, expect } from '@playwright/test';

const MOCK_RESPONSE = JSON.stringify({
  beslutning_oppsummert: 'Lansere abonnementsbasert tjeneste for produktteam.',
  antakelser: {
    målgruppe_behov: [
      { id: 'mb1', text: 'Produktteam mangler tid til brukerinnsikt', category: 'målgruppe_behov' },
      { id: 'mb2', text: 'Mellomstore selskaper er målgruppen', category: 'målgruppe_behov' },
    ],
    løsning_produkt: [
      { id: 'lp1', text: 'AI kan analysere kundedata effektivt', category: 'løsning_produkt' },
    ],
    marked_konkurranse: [
      { id: 'mk1', text: 'Markedet er klart for denne løsningen', category: 'marked_konkurranse' },
    ],
    forretning_skalering: [
      { id: 'fs1', text: 'Gratisversjon konverterer til betalende', category: 'forretning_skalering' },
    ],
  },
  antall_totalt: 5,
});

test.describe('Antakelseskart', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/antakelseskart', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.stream) {
        const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
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
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Finn antakelsene');
    await expect(page.locator('#beslutning-input')).toBeVisible();
  });

  test('shows character counter and validation', async ({ page }) => {
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Short text — still disabled
    await textarea.fill('Kort tekst');
    await expect(submitButton).toBeDisabled();

    // 50+ chars — enabled
    await textarea.fill('Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam.');
    await expect(submitButton).toBeEnabled();
  });

  test('happy path: submit and receive analysis', async ({ page }) => {
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    await textarea.fill('Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam som trenger bedre beslutningsstøtte.');
    await submitButton.click();

    // Wait for category sections to appear
    await expect(page.locator('text=Målgruppe og behov')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Løsning og produkt')).toBeVisible();
    await expect(page.locator('text=Marked og konkurranse')).toBeVisible();
    await expect(page.locator('text=Forretning og skalering')).toBeVisible();

    // Verify assumption text from mock
    await expect(page.locator('text=Produktteam mangler tid til brukerinnsikt')).toBeVisible();
  });

  test('displays loading state during submission', async ({ page }) => {
    await page.route('**/api/antakelseskart', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });

    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    await textarea.fill('Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam.');
    await submitButton.click();

    // Check for loading indicator
    await expect(page.locator('text=Avdekker antakelser')).toBeVisible();
  });

  test('handles API error gracefully', async ({ page }) => {
    await page.route('**/api/antakelseskart', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Noe gikk galt. Prøv igjen.' }),
      });
    });

    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    await textarea.fill('En beslutning som vil utløse en feil fra API-et for å teste feilhåndtering.');
    await submitButton.click();

    await expect(page.locator('text=Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });

  test('can reset after result', async ({ page }) => {
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    await textarea.fill('Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam.');
    await submitButton.click();
    await expect(page.locator('text=Målgruppe og behov')).toBeVisible({ timeout: 10000 });

    // Click reset
    await page.getByRole('button', { name: /Start på nytt/i }).click();

    // Textarea should be empty
    await expect(textarea).toHaveValue('');
    await expect(submitButton).toBeDisabled();
  });

  test('shows copy button after result', async ({ page }) => {
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });

    await textarea.fill('Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam.');
    await submitButton.click();
    await expect(page.locator('text=Målgruppe og behov')).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('button', { name: /Kopier/i })).toBeVisible();
  });

  test('edit preserves input', async ({ page }) => {
    await page.goto('/antakelseskart');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('#beslutning-input');
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Avdekk antakelser/i });
    const inputText = 'Vi vurderer å lansere en abonnementsbasert tjeneste for mellomstore produktteam.';

    await textarea.fill(inputText);
    await submitButton.click();
    await expect(page.locator('text=Målgruppe og behov')).toBeVisible({ timeout: 10000 });

    // Click edit
    await page.getByRole('button', { name: /Rediger/i }).click();

    // Textarea should still have original input
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(inputText);
  });
});
