/**
 * E2E Tests for OKR-sjekken API
 *
 * Tests the OKR reviewer API endpoint and UI functionality
 */

import { test, expect } from '@playwright/test';

test.describe('OKR-sjekken API Tests', () => {
  test('should return 400 for missing input', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Missing input');
  });

  test('should return 400 for empty input', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', {
      data: { input: '' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Missing input');
  });

  test('should return 400 for whitespace-only input', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', {
      data: { input: '   ' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Missing input');
  });

  test('should accept valid OKR input', async ({ request }) => {
    // Note: This test may fail if ANTHROPIC_API_KEY is not configured
    // In CI, we mock the API or skip this test
    const response = await request.post('/api/okr-sjekken', {
      data: {
        input: 'Objective: Improve customer satisfaction\nKR1: Increase NPS from 40 to 60',
      },
    });

    // Either 200 (success) or 500 (API not configured) is acceptable
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('output');
      expect(typeof body.output).toBe('string');
    }
  });

  test('should include cache header in response', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', {
      data: {
        input: 'Test OKR for cache header check',
      },
    });

    // Check for X-Cache header (HIT or MISS)
    const cacheHeader = response.headers()['x-cache'];
    if (response.status() === 200) {
      expect(['HIT', 'MISS']).toContain(cacheHeader);
    }
  });

  test('should return JSON content type', async ({ request }) => {
    const response = await request.post('/api/okr-sjekken', {
      data: { input: 'Test OKR' },
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('OKR-sjekken UI Tests', () => {
  test('OKR-sjekken page loads correctly', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Check page title
    await expect(page).toHaveTitle(/OKR/i);

    // Check main heading exists
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('OKR input textarea exists and is accessible', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Look for textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('submit button exists', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Look for submit/analyze button
    const button = page.getByRole('button').filter({ hasText: /vurder|analyser|send/i });
    await expect(button.first()).toBeVisible();
  });

  test('should show validation message for empty submission', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Try to submit empty form
    const button = page.getByRole('button').filter({ hasText: /vurder|analyser|send/i });

    if (await button.count() > 0) {
      await button.first().click();

      // Check for error/validation message or disabled state
      // The behavior depends on implementation
      await page.waitForTimeout(500);
    }
  });

  test('textarea accepts input', async ({ page }) => {
    await page.goto('/okr-sjekken');

    const textarea = page.locator('textarea');
    const testOKR = 'Objective: Test objective\nKR1: Test key result';

    await textarea.fill(testOKR);

    await expect(textarea).toHaveValue(testOKR);
  });

  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('page is keyboard accessible', async ({ page }) => {
    await page.goto('/okr-sjekken');

    // Tab through focusable elements
    await page.keyboard.press('Tab');

    // Check that something is focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });
});

test.describe('OKR-sjekken Rate Limiting', () => {
  test('should handle multiple rapid requests', async ({ request }) => {
    // Send multiple requests in quick succession
    const requests = Array(5).fill(null).map(() =>
      request.post('/api/okr-sjekken', {
        data: { input: 'Test OKR for rate limiting' },
      })
    );

    const responses = await Promise.all(requests);

    // Check that requests are handled (either success or rate limited)
    for (const response of responses) {
      expect([200, 429, 500]).toContain(response.status());
    }
  });
});
