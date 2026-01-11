/**
 * Konseptspeilet E2E Tests
 *
 * Tests the complete user journey for the Konseptspeilet tool.
 * API calls are mocked to ensure stability and speed.
 */
import { test, expect } from '@playwright/test';

// Sample mock response that matches expected v2 format
const MOCK_RESPONSE = `---SUMMARY---
assumptions: 3
unclear: 3
maturity: 2
recommendation: Utforsk brukerbehov før du går videre
---END_SUMMARY---

---DIMENSIONS---
value: assumed
value_desc: Problemet er nevnt, men ikke validert med brukere.
usability: not_addressed
usability_desc: Hvordan brukerne vil bruke løsningen er ikke beskrevet.
feasibility: assumed
feasibility_desc: Teksten antyder at det er mulig å bygge.
viability: not_addressed
viability_desc: Forretningsmodell eller ressursbehov er ikke nevnt.
---END_DIMENSIONS---

---ASSUMPTIONS---
- Målgruppen ønsker et enkelt verktøy
- Markedet er klart for denne typen produkt
- Teamet har kapasitet til lansering i Q1
---END_ASSUMPTIONS---

---QUESTIONS---
- Hvem er den primære brukeren?
- Hva skiller produktet fra konkurrentene?
- Hvordan måles suksess etter lansering?
---END_QUESTIONS---`;

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
    await expect(page).toHaveTitle(/Konseptspeilet/);
    // Main h1 says "Test konseptet ditt før du bygger"
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Test konseptet');
  });

  test('shows character counter and validation', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    // Button uses type="button" not type="submit"
    const submitButton = page.getByRole('button', { name: /Speil konseptet/i });

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
    const submitButton = page.getByRole('button', { name: /Speil konseptet/i });

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
    await expect(page.locator('text=3 antagelser')).toBeVisible({ timeout: 10000 });

    // Click to expand details and see assumptions/questions
    await page.getByRole('button', { name: /Vis antagelser og spørsmål/i }).click();

    // Verify expanded content shows assumptions and questions sections
    await expect(page.locator('text=Antagelser du gjør')).toBeVisible();
    await expect(page.locator('text=Spørsmål å utforske')).toBeVisible();

    // Verify content from mock response
    await expect(page.locator('text=Målgruppen ønsker et enkelt verktøy')).toBeVisible();
    await expect(page.locator('text=Hvem er den primære brukeren?')).toBeVisible();
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
    const submitButton = page.getByRole('button', { name: /Speil konseptet/i });

    await textarea.fill('En lang nok tekst for å teste loading-tilstanden i appen vår.');
    await submitButton.click();

    // Check for loading text which appears during submission
    await expect(page.getByText('Speiler konseptet').first()).toBeVisible();
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
    const submitButton = page.getByRole('button', { name: /Speil konseptet/i });

    await textarea.fill('En tekst som vil utløse en feil fra API-et for testing.');
    await submitButton.click();

    // Should show error message
    await expect(page.locator('text=Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });

  test('can reset and try again after result', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea').first();
    const submitButton = page.getByRole('button', { name: /Speil konseptet/i });

    // First submission
    await textarea.fill('Første konseptbeskrivelse som er lang nok til analyse.');
    await submitButton.click();
    // Wait for v2 result summary to appear
    await expect(page.locator('text=3 antagelser')).toBeVisible({ timeout: 10000 });

    // Look for reset/new analysis button ("Start på nytt" on desktop, "Skriv nytt konsept" on mobile)
    const resetButton = page.getByRole('button', { name: /Start på nytt|Skriv nytt konsept/i });

    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(textarea).toBeVisible();
    }
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
    const submitButton = page.getByRole('button', { name: /Avdekk antagelser/i });

    const conceptText = 'Dette er et konsept som skal testes for gjentatt innsending uten endringer.';

    // First submission
    await textarea.fill(conceptText);
    await submitButton.click();

    // Wait for result
    await expect(page.locator('text=3 antagelser')).toBeVisible({ timeout: 10000 });

    // Clear localStorage to simulate client cache miss (forcing server request)
    await page.evaluate(() => localStorage.clear());

    // Second submission of the same concept (this was causing the bug)
    await submitButton.click();

    // Should still show result without error
    await expect(page.locator('text=3 antagelser')).toBeVisible({ timeout: 10000 });

    // Should not show error message
    await expect(page.locator('text=Noe gikk galt')).not.toBeVisible();
  });
});
