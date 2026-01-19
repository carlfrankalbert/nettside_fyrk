/**
 * Streaming Resilience Tests
 *
 * Tests that the UI handles streaming edge cases gracefully:
 * - Partial responses / connection drops
 * - Incomplete JSON
 * - Slow/stalled connections
 */
import { test, expect } from '@playwright/test';

test.describe('Streaming Resilience', () => {
  test.describe('Partial Response Handling', () => {
    test('handles connection drop mid-stream gracefully', async ({ page }) => {
      // Simulate a stream that starts but never completes (no [DONE] marker)
      await page.route('**/api/konseptspeilet', async (route) => {
        const partialResponse = `data: ${JSON.stringify({ text: '{"refleksjon_status": {"kommentar": "Partial...' })}\n\n`;

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: partialResponse,
          // No [DONE] marker - simulates dropped connection
        });
      });

      await page.goto('/konseptspeilet');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('#main-content').getByRole('button', {
        name: /Start speiling/i,
      });

      await textarea.fill(
        'Test input for partial response handling. This needs to be long enough.'
      );
      await submitButton.click();

      // Should eventually show error or allow retry - not hang forever
      // Wait for retry button to appear (indicates graceful error handling)
      await expect(page.getByRole('button', { name: 'Prøv igjen' })).toBeVisible({
        timeout: 15000,
      });

      // Page should not be in a broken state
      await expect(textarea).toBeVisible();
    });

    test('handles incomplete JSON in stream gracefully', async ({ page }) => {
      // Return valid SSE format but with malformed JSON content
      await page.route('**/api/konseptspeilet', async (route) => {
        const malformedResponse = `data: ${JSON.stringify({ text: '{"refleksjon_status": {' })}\n\ndata: [DONE]\n\n`;

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: malformedResponse,
        });
      });

      await page.goto('/konseptspeilet');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('#main-content').getByRole('button', {
        name: /Start speiling/i,
      });

      await textarea.fill(
        'Test input for malformed JSON handling. Making this long enough to submit.'
      );
      await submitButton.click();

      // Should show error or fallback state - not crash
      await expect(page.getByRole('button', { name: 'Prøv igjen' })).toBeVisible({
        timeout: 10000,
      });
    });

    test('handles empty stream response gracefully', async ({ page }) => {
      await page.route('**/api/konseptspeilet', async (route) => {
        // Just the DONE marker, no actual data
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'data: [DONE]\n\n',
        });
      });

      await page.goto('/konseptspeilet');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('#main-content').getByRole('button', {
        name: /Start speiling/i,
      });

      await textarea.fill('Test input for empty stream. This is long enough to pass validation.');
      await submitButton.click();

      // Should show error state, not empty/broken UI
      await expect(page.getByRole('button', { name: 'Prøv igjen' })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Timeout Handling', () => {
    test('handles slow response without freezing UI', async ({ page }) => {
      await page.route('**/api/konseptspeilet', async (route) => {
        // Simulate very slow response (but eventually completes)
        await new Promise((resolve) => setTimeout(resolve, 8000));

        const validResponse = JSON.stringify({
          refleksjon_status: { kommentar: 'Delayed response', antagelser_funnet: 0 },
          fokus_sporsmal: { overskrift: 'Test', sporsmal: 'Test?', hvorfor: 'Testing' },
          dimensjoner: {
            verdi: { status: 'ikke_nevnt', observasjon: 'Test' },
            brukbarhet: { status: 'ikke_nevnt', observasjon: 'Test' },
            gjennomforbarhet: { status: 'ikke_nevnt', observasjon: 'Test' },
            levedyktighet: { status: 'ikke_nevnt', observasjon: 'Test' },
          },
          antagelser_liste: [],
        });

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: `data: ${JSON.stringify({ text: validResponse })}\n\ndata: [DONE]\n\n`,
        });
      });

      await page.goto('/konseptspeilet');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('#main-content').getByRole('button', {
        name: /Start speiling/i,
      });

      await textarea.fill(
        'Test input for slow response handling. Making it long enough to submit.'
      );
      await submitButton.click();

      // Should show loading state while waiting
      await expect(
        page.getByText(/Leser gjennom|Kartlegger|Identifiserer|Formulerer/).first()
      ).toBeVisible({ timeout: 3000 });

      // Should eventually complete (either success or handled timeout)
      await expect(
        page
          .locator('text=Delayed response')
          .or(page.locator('text=Prøv igjen'))
          .or(page.locator('text=tidsavbrudd'))
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Recovery', () => {
    test('can retry after failed stream', async ({ page }) => {
      let requestCount = 0;

      await page.route('**/api/konseptspeilet', async (route) => {
        requestCount++;

        if (requestCount === 1) {
          // First request fails
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Temporary failure' }),
          });
        } else {
          // Second request succeeds
          const validResponse = JSON.stringify({
            refleksjon_status: { kommentar: 'Success on retry', antagelser_funnet: 1 },
            fokus_sporsmal: { overskrift: 'Test', sporsmal: 'Retry worked?', hvorfor: 'Yes' },
            dimensjoner: {
              verdi: { status: 'beskrevet', observasjon: 'Good' },
              brukbarhet: { status: 'ikke_nevnt', observasjon: 'Test' },
              gjennomforbarhet: { status: 'ikke_nevnt', observasjon: 'Test' },
              levedyktighet: { status: 'ikke_nevnt', observasjon: 'Test' },
            },
            antagelser_liste: ['Test assumption'],
          });

          await route.fulfill({
            status: 200,
            contentType: 'text/event-stream',
            body: `data: ${JSON.stringify({ text: validResponse })}\n\ndata: [DONE]\n\n`,
          });
        }
      });

      await page.goto('/konseptspeilet');
      await page.waitForLoadState('networkidle');

      const textarea = page.locator('textarea').first();
      const submitButton = page.locator('#main-content').getByRole('button', {
        name: /Start speiling/i,
      });

      // First attempt - should fail
      await textarea.fill('Test input for retry functionality. Long enough to submit.');
      await submitButton.click();

      // Should show error
      await expect(page.locator('text=gikk galt').or(page.locator('text=Prøv igjen'))).toBeVisible({
        timeout: 10000,
      });

      // Try again - should succeed
      await submitButton.click();

      // Should show success
      await expect(page.locator('text=Success on retry')).toBeVisible({ timeout: 10000 });
    });
  });
});
