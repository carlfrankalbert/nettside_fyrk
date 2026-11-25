/**
 * Tool flow smoke test: one AI tool end to end, with the API mocked.
 * The other AI tools share the same streaming client and hook, so one
 * happy path and one error path cover the shared machinery.
 */
import { test, expect, type Page } from '@playwright/test';

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

const SUBMIT = /Start speiling/i;

async function submitConcept(page: Page) {
  await page.goto('/konseptspeilet');
  // Wait for hydration, otherwise the fill does not reach React state
  await page.waitForLoadState('networkidle');
  await page.locator('textarea').first().fill(
    'Vi bygger en plattform som hjelper småbedrifter med å automatisere fakturering.'
  );
  // Desktop submits from the form; mobile from a sticky CTA outside <main>
  await page.getByRole('button', { name: SUBMIT }).filter({ visible: true }).first().click();
}

test.describe('Konseptspeilet flow', () => {
  test('submit shows the analysis', async ({ page }) => {
    await page.route('**/api/konseptspeilet', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`,
      })
    );

    await submitConcept(page);

    await expect(page.getByRole('heading', { name: 'Antagelser i teksten' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hvem er den primære brukeren?')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start på nytt/i })).toBeVisible();
  });

  test('API error shows a friendly message', async ({ page }) => {
    await page.route('**/api/konseptspeilet', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Noe gikk galt. Prøv igjen.' }),
      })
    );

    await submitConcept(page);

    await expect(page.getByText('Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });
});
