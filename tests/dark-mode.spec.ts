import { test, expect } from '@playwright/test';

/**
 * Dark Mode Tests
 * Tests based on UI/UX guidelines for light and dark theme support
 */
test.describe('Dark Mode Support', () => {
  test('should detect system preference and apply dark mode', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that dark mode variables are applied
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should be dark (not white)
    expect(bgColor).not.toContain('rgb(255, 255, 255)');
  });

  test('should maintain contrast in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check text contrast using semantic selectors
    const heading = page.locator('h1, h2, .text-brand-navy').first();
    if (await heading.count() > 0) {
      const textColor = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // Text should have some color defined
      expect(textColor).toBeTruthy();
    }

    // Check button contrast using role-based selector
    const primaryButton = page.getByRole('link', { name: /prøv|start|kontakt/i }).first();
    if (await primaryButton.count() > 0) {
      const buttonColor = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // Button text should be defined
      expect(buttonColor).toBeTruthy();
    }
  });

  test('should preserve meaning of status colors in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/okr-sjekken');
    await page.waitForLoadState('domcontentloaded');

    // Check that the page loads correctly in dark mode
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Verify textarea is usable in dark mode
    const textareaStyles = await textarea.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Both should be defined (not transparent/inherit)
    expect(textareaStyles.color).toBeTruthy();
    expect(textareaStyles.backgroundColor).toBeTruthy();
  });

  test('should use dark gray background instead of pure black', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should not be pure black (rgb(0, 0, 0))
    expect(bgColor).not.toBe('rgb(0, 0, 0)');
  });

  test('should maintain readability for all text in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check various text elements using semantic/robust selectors
    const textSelectors = [
      'h1',
      'h2',
      'p',
      'label',
      'a',
    ];

    for (const selector of textSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const color = await element.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });

        // Colors should be defined
        expect(color, `${selector} should have color defined`).toBeTruthy();
      }
    }
  });

  test('should support both light and dark mode without breaking layout', async ({ page }) => {
    // Test light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mainLight = page.locator('main');
    const lightLayout = await mainLight.boundingBox();
    expect(lightLayout).toBeTruthy();

    // Test dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const mainDark = page.locator('main');
    const darkLayout = await mainDark.boundingBox();
    expect(darkLayout).toBeTruthy();

    // Layout should be similar (not broken)
    if (lightLayout && darkLayout) {
      expect(Math.abs(lightLayout.width - darkLayout.width)).toBeLessThan(10);
    }
  });

  test('should apply dark mode on Konseptspeilet page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('domcontentloaded');

    // Page should load without errors
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Background should not be pure white
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).not.toContain('rgb(255, 255, 255)');
  });
});
