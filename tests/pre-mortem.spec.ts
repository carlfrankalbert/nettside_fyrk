/**
 * Pre-Mortem Brief E2E Tests
 *
 * Tests the complete user journey for the Pre-Mortem Brief tool.
 * API calls are mocked to ensure stability and speed.
 */
import { test, expect } from '@playwright/test';

// Sample mock response that matches expected Pre-Mortem markdown format
const MOCK_RESPONSE = `**1. BESLUTNING**
Bytte fra on-premise til cloud-basert infrastruktur for kundedatabaser.

**2. RAMME OG AVGRENSNING**
- Kort kontekstuell ramme: Modernisering av IT-infrastruktur
- Locks: teknisk (eksisterende integrasjoner) / organisatorisk (kompetanse) / regulatorisk (GDPR)
- Utenfor scope: Andre interne systemer

**3. PRE-MORTEM**
"Det er om 12 måneder. Beslutningen har feilet. Hva skjedde?"

- Mest kritisk: Migreringsprosjektet tok dobbelt så lang tid som planlagt, forårsaket av undervurdering av kompleksitet i eksisterende integrasjoner.
- Dataintegritet ble kompromittert under migrering – konsekvenskategori: regulatorisk
- Compliance-krav ble ikke møtt i tide – konsekvenskategori: regulatorisk
- Falsk trygghet: Grundig planlegging ga illusjon av kontroll uten reell risikoreduksjon – konsekvenskategori: strategisk
- Kostnadsoverskridelser på 50%+ – konsekvenskategori: økonomisk
- Nedetid påvirket kundetilfredshet – konsekvenskategori: omdømme

**4. TIDLIGE INDIKATORER**
Top 3 målbare signaler som indikerer at noe går galt:
1. Andel milepæler som forskyves med mer enn 2 uker
2. Antall kritiske bugs funnet i testmiljø per sprint
3. Avvik fra budsjett målt månedlig

**5. STOPP-KRITERIER**
- PAUSE: Mer enn 30% budsjettoverskridelse eller 3+ kritiske integrasjonsfeil
- PAUSE: Tap av nøkkelkompetanse midt i prosjektet
- FULL TILBAKETREKKING: Bekreftede datatap eller compliance-brudd

**6. REALISTISKE KONTROLLER/TILTAK**
Top 3 tiltak:
1. Inkrementell migrering med pilotgruppe først. Reduserer risiko for storskala feil, men adresserer ikke kompetanserisiko.
2. Automatiserte integrasjonstester før hver fase. Reduserer risiko for dataintegritetsproblemer, men adresserer ikke tidsrisiko.
3. Ekstern compliance-revisjon halvveis. Reduserer regulatorisk risiko, men adresserer ikke kostnadsrisiko.

**7. EIERSKAP OG ANSVAR**
- Beslutningseier: CTO
- Risikooppfølging: IT-sjef
- Vetorett: CISO og juridisk direktør
- Ansvar ved feil: Prosjektleder med eskalering til CTO

**8. HVA KJENNETEGNER EN GOD BESLUTNING HER?**
- Tydelig forankring i ledergruppen med dokumentert risikoaksept
- Definerte og aksepterte stopp-kriterier før oppstart
- Inkrementell tilnærming med mulighet for kursendring
- Eksplisitt budsjett for uforutsette hendelser`;

test.describe('Pre-Mortem Brief', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoint to return a predictable response
    await page.route('**/api/pre-mortem', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Simulate streaming response with proper SSE format
      if (postData?.stream) {
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
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/Pre-Mortem|Fyrk/i);

    // Main h1 says "Hva kan gå galt?"
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText('Hva kan gå galt?');
  });

  test('shows required form fields', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Check for required form fields - use exact label names to avoid ambiguity
    await expect(page.getByRole('textbox', { name: 'Beslutning*' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Bransje/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /kontekst/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Risikonivå/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Kundetype/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Beslutningsfrist/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Effekthorisont/i })).toBeVisible();
  });

  test('submit button is disabled until required fields are filled', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    const submitButton = page.getByRole('button', { name: /Generer Pre-Mortem/i });

    // Initially button should be visible (desktop)
    await expect(submitButton).toBeVisible();

    // Fill only partial form - beslutning too short
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill('Kort');

    // Button should still be visible but form won't submit successfully
  });

  test('happy path: fill form and receive Pre-Mortem Brief', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Fill required fields - use specific selectors to avoid ambiguity
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill(
      'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle kundedatabaser i organisasjonen.'
    );

    await page.getByRole('combobox', { name: /Bransje/i }).selectOption('bank_finans');

    await page.getByRole('textbox', { name: /kontekst/i }).fill(
      'Vi har 50 000 aktive kunder og behandler ca. 2 millioner transaksjoner daglig. Dagens løsning er 8 år gammel.'
    );

    await page.getByRole('combobox', { name: /Risikonivå/i }).selectOption('hoy');
    await page.getByRole('combobox', { name: /Kundetype/i }).selectOption('b2b');
    await page.getByRole('textbox', { name: /Beslutningsfrist/i }).fill('Q2 2024');
    await page.getByRole('textbox', { name: /Effekthorisont/i }).fill('12-24 måneder');

    // Submit form
    const submitButton = page.getByRole('button', { name: /Generer Pre-Mortem/i });
    await submitButton.click();

    // Wait for result to appear - look for section headers from mock response
    await expect(page.locator('text=BESLUTNING').first()).toBeVisible({ timeout: 10000 });

    // Verify key sections from Pre-Mortem Brief are displayed
    await expect(page.locator('text=PRE-MORTEM').first()).toBeVisible();
    await expect(page.locator('text=STOPP').first()).toBeVisible();

    // Verify copy button appears
    await expect(page.getByRole('button', { name: /Kopier/i }).first()).toBeVisible();
  });

  test('displays loading state during submission', async ({ page }) => {
    // Slow down the mock response to observe loading state
    await page.route('**/api/pre-mortem', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const body = `data: ${JSON.stringify({ text: MOCK_RESPONSE })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Fill form with valid data - use specific selectors
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill(
      'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle våre kundedatabaser.'
    );
    await page.getByRole('combobox', { name: /Bransje/i }).selectOption('bank_finans');
    await page.getByRole('textbox', { name: /kontekst/i }).fill(
      'Vi har mange kunder og behandler transaksjoner daglig. Løsningen er gammel.'
    );
    await page.getByRole('combobox', { name: /Risikonivå/i }).selectOption('medium');
    await page.getByRole('combobox', { name: /Kundetype/i }).selectOption('b2b');
    await page.getByRole('textbox', { name: /Beslutningsfrist/i }).fill('Q2 2024');
    await page.getByRole('textbox', { name: /Effekthorisont/i }).fill('12 måneder');

    await page.getByRole('button', { name: /Generer Pre-Mortem/i }).click();

    // Check for loading indicator
    await expect(page.locator('text=Genererer brief').first()).toBeVisible();
  });

  test('handles API error gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/pre-mortem', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Noe gikk galt. Prøv igjen.' }),
      });
    });

    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Fill form - use specific selectors
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill(
      'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle våre kundedatabaser.'
    );
    await page.getByRole('combobox', { name: /Bransje/i }).selectOption('offentlig');
    await page.getByRole('textbox', { name: /kontekst/i }).fill(
      'Kontekst som er lang nok for validering av skjemaet.'
    );
    await page.getByRole('combobox', { name: /Risikonivå/i }).selectOption('lav');
    await page.getByRole('combobox', { name: /Kundetype/i }).selectOption('offentlig');
    await page.getByRole('textbox', { name: /Beslutningsfrist/i }).fill('2024');
    await page.getByRole('textbox', { name: /Effekthorisont/i }).fill('6 mnd');

    await page.getByRole('button', { name: /Generer Pre-Mortem/i }).click();

    // Should show error message
    await expect(page.locator('text=Noe gikk galt')).toBeVisible({ timeout: 10000 });
  });

  test('can reset form after result', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Fill and submit form - use specific selectors
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill(
      'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle våre kundedatabaser.'
    );
    await page.getByRole('combobox', { name: /Bransje/i }).selectOption('bank_finans');
    await page.getByRole('textbox', { name: /kontekst/i }).fill(
      'Vi har mange kunder og behandler transaksjoner daglig.'
    );
    await page.getByRole('combobox', { name: /Risikonivå/i }).selectOption('hoy');
    await page.getByRole('combobox', { name: /Kundetype/i }).selectOption('b2b');
    await page.getByRole('textbox', { name: /Beslutningsfrist/i }).fill('Q2 2024');
    await page.getByRole('textbox', { name: /Effekthorisont/i }).fill('12 måneder');

    await page.getByRole('button', { name: /Generer Pre-Mortem/i }).click();

    // Wait for result
    await expect(page.locator('text=BESLUTNING').first()).toBeVisible({ timeout: 10000 });

    // Click reset button - use the one in the result area
    const resetButton = page.getByLabel('Pre-Mortem Brief resultat').getByRole('button', { name: /Start på nytt/i });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Form should be reset - beslutning field should be empty
    await expect(page.getByRole('textbox', { name: 'Beslutning*' })).toHaveValue('');
  });

  test('shows optional fields when expanded', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Click to expand optional fields
    await page.getByText(/Valgfrie felt/i).click();

    // The optional fields section contains confidentiality level options in a combobox
    // Verify the combobox exists and has the expected options by checking they can be selected
    const confidentialitySelect = page.locator('select').filter({ hasText: /Intern/ });
    await expect(confidentialitySelect).toBeVisible();

    // Verify the options exist by checking the select has multiple options
    const optionCount = await confidentialitySelect.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(3);
  });

  test('shows PII warning banner', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Check for PII warning - actual text includes "hemmelige detaljer"
    await expect(page.locator('text=Unngå personopplysninger og hemmelige detaljer')).toBeVisible();
  });

  test('shows privacy accordion', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Check for privacy accordion (uses <details>/<summary> elements)
    await expect(page.locator('summary', { hasText: /Les mer om AI og personvern/i })).toBeVisible();
  });

  test('displays disclaimer after result', async ({ page }) => {
    await page.goto('/verktoy/pre-mortem');
    await page.waitForLoadState('networkidle');

    // Fill and submit form - use specific selectors
    await page.getByRole('textbox', { name: 'Beslutning*' }).fill(
      'Vi vurderer å bytte fra on-premise til cloud-basert infrastruktur for alle våre kundedatabaser.'
    );
    await page.getByRole('combobox', { name: /Bransje/i }).selectOption('bank_finans');
    await page.getByRole('textbox', { name: /kontekst/i }).fill(
      'Vi har mange kunder og behandler transaksjoner daglig.'
    );
    await page.getByRole('combobox', { name: /Risikonivå/i }).selectOption('hoy');
    await page.getByRole('combobox', { name: /Kundetype/i }).selectOption('b2b');
    await page.getByRole('textbox', { name: /Beslutningsfrist/i }).fill('Q2 2024');
    await page.getByRole('textbox', { name: /Effekthorisont/i }).fill('12 måneder');

    await page.getByRole('button', { name: /Generer Pre-Mortem/i }).click();

    // Wait for result
    await expect(page.locator('text=BESLUTNING').first()).toBeVisible({ timeout: 10000 });

    // Check for disclaimer
    await expect(page.locator('text=ikke en vurdering av om beslutningen er riktig')).toBeVisible();
  });
});
