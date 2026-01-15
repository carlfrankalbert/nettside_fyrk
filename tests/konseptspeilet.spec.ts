/**
 * Konseptspeilet E2E Tests
 *
 * Tests the complete user journey for the Konseptspeilet tool.
 * API calls are mocked to ensure stability and speed.
 */
import { test, expect } from '@playwright/test';

// Sample mock response that matches expected v2 JSON format
const MOCK_RESPONSE = JSON.stringify({
  refleksjon_status: {
    kommentar: 'Du har beskrevet løsningen detaljert, men problemet den løser er kun antydet.',
    antagelser_funnet: 3
  },
  fokus_sporsmal: {
    overskrift: 'HVIS DU VIL UTFORSKE ÉN TING VIDERE',
    sporsmal: 'Hvem er den primære brukeren?',
    hvorfor: 'Problemet er nevnt, men ikke konkretisert.'
  },
  dimensjoner: {
    verdi: {
      status: 'antatt',
      observasjon: 'Problemet er nevnt, men ikke validert med brukere.'
    },
    brukbarhet: {
      status: 'ikke_nevnt',
      observasjon: 'Hvordan brukerne vil bruke løsningen er ikke beskrevet.'
    },
    gjennomforbarhet: {
      status: 'antatt',
      observasjon: 'Teksten antyder at det er mulig å bygge.'
    },
    levedyktighet: {
      status: 'ikke_nevnt',
      observasjon: 'Forretningsmodell eller ressursbehov er ikke nevnt.'
    }
  },
  antagelser_liste: [
    'Målgruppen ønsker et enkelt verktøy',
    'Markedet er klart for denne typen produkt',
    'Teamet har kapasitet til lansering i Q1'
  ]
});

test.describe('Konseptspeilet', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoint to return a predictable response
    await page.route('**/api/konseptspeilet', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Simulate streaming response with proper SSE format
      if (postData?.stream) {
        // Send entire response as one SSE event (simpler and more reliable for testing)
        const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
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
    await expect(page).toHaveTitle(/produktidéer|antakelser|Fyrk/i);
    // Main h1 says "Forstå ideen din bedre"
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Forstå ideen din bedre');
  });

  test('shows character counter and validation', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    // Button uses type="button" not type="submit"
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

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
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    // Enter valid concept description
    const conceptDescription = `
      Vi bygger en plattform for å hjelpe småbedrifter med å automatisere
      faktureringsprosessen. Løsningen skal integreres med eksisterende
      regnskapssystemer og redusere tid brukt på administrasjon.
    `;
    await textarea.fill(conceptDescription);

    // Submit form
    await submitButton.click();

    // Wait for v2 result summary to appear (shows assumption count)
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Antagelser section is open by default in v2.1
    await expect(page.getByRole('heading', { name: 'Antagelser i teksten' })).toBeVisible();

    // Verify focus question is shown (the key question to explore)
    await expect(page.locator('text=Hvem er den primære brukeren?')).toBeVisible();

    // Verify content from mock response antagelser
    await expect(page.locator('text=Målgruppen ønsker et enkelt verktøy')).toBeVisible();

    // Verify action button is present (Start på nytt - reset button)
    await expect(page.getByRole('button', { name: /Start på nytt/i })).toBeVisible();
  });

  test('displays loading state during submission', async ({ page }) => {
    // Slow down the mock response to observe loading state
    await page.route('**/api/konseptspeilet', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Return SSE format since component uses streaming
      const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    await textarea.fill('En lang nok tekst for å teste loading-tilstanden i appen vår.');
    await submitButton.click();

    // Check for narrative loader messages during submission (NarrativeLoader cycles through messages)
    await expect(page.getByText(/Leser gjennom|Kartlegger|Identifiserer|Formulerer/).first()).toBeVisible();
  });

  test('handles API error gracefully', async ({ page }) => {
    // Mock error response - service checks response.ok first for non-200 status
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
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    await textarea.fill('En tekst som vil utløse en feil fra API-et for testing.');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('text=Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });

  test('can reset and try again after result', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    // First submission
    await textarea.fill('Første konseptbeskrivelse som er lang nok til analyse.');
    await submitButton.click();
    // Wait for v2 result summary to appear
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // "Start på nytt" resets completely
    const resetButton = page.getByRole('button', { name: /Start på nytt/i });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // After reset, textarea should be visible and empty
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue('');
  });

  test('handles resubmission of same concept without error', async ({ page }) => {
    // Track API call count to verify caching behavior
    let apiCallCount = 0;

    await page.route('**/api/konseptspeilet', async (route) => {
      apiCallCount++;
      const request = route.request();
      const postData = request.postDataJSON();

      // Always return SSE format for streaming requests (simulates server cache hit on second call)
      if (postData?.stream) {
        const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Cache': apiCallCount > 1 ? 'HIT' : 'MISS',
          },
          body,
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ output: MOCK_RESPONSE, cached: apiCallCount > 1 }),
        });
      }
    });

    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    // Clear localStorage to ensure we're testing server-side cache behavior
    await page.evaluate(() => localStorage.clear());

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    const conceptText = 'Dette er et konsept som skal testes for gjentatt innsending uten endringer.';

    // First submission
    await textarea.fill(conceptText);
    await submitButton.click();

    // Wait for result
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Clear localStorage to simulate client cache miss (forcing server request)
    await page.evaluate(() => localStorage.clear());

    // Second submission of the same concept (this was causing the bug)
    await submitButton.click();

    // Should still show result without error
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Should not show error message
    await expect(page.locator('text=Noe gikk galt')).not.toBeVisible();
  });

  test('preserves input after submission for further editing', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });
    const originalInput = 'Første konseptbeskrivelse som er lang nok til analyse.';

    // First submission
    await textarea.fill(originalInput);
    await submitButton.click();
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Textarea should still be visible with original input for further editing
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(originalInput);

    // Submit button should be enabled for resubmission
    await expect(submitButton).toBeEnabled();
  });

  test('shows dimension cards with status indicators', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    await textarea.fill('En konseptbeskrivelse for å teste dimensjonskort visning.');
    await submitButton.click();
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Verify all four dimensions are shown (Cagan framework) - use heading role for precision
    await expect(page.getByRole('heading', { name: 'Verdi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Brukbarhet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gjennomførbarhet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Levedyktighet' })).toBeVisible();
  });

  test('shows collapsible input review', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    await textarea.fill('En konseptbeskrivelse for å teste kollapserbar input visning.');
    await submitButton.click();
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // "Din tekst" section should be present (collapsible input review)
    await expect(page.locator('text=Din tekst')).toBeVisible();
  });

  test('shows copy buttons for each dimension after result', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.locator('#main-content').getByRole('button', { name: /Start speiling/i });

    await textarea.fill('En konseptbeskrivelse for å teste kopieringsknapper.');
    await submitButton.click();
    await expect(page.locator('text=Se antagelser i teksten nedenfor')).toBeVisible({ timeout: 10000 });

    // Each dimension card has a copy button (e.g., "Kopier Verdi", "Kopier Brukbarhet")
    await expect(page.getByRole('button', { name: /Kopier Verdi/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Kopier Brukbarhet/i })).toBeVisible();
  });
});
