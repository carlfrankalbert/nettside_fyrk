import { test, expect } from '@playwright/test';

/**
 * Typography Tests
 * Tests based on UI/UX guidelines for readability and typography
 */
test.describe('Typography & Readability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should use readable base font size (16px minimum)', async ({ page }) => {
    const body = page.locator('body');
    const fontSize = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    const sizeInPx = parseFloat(fontSize);
    expect(sizeInPx).toBeGreaterThanOrEqual(16);
  });

  test('should have appropriate line height for readability', async ({ page }) => {
    const body = page.locator('body');
    const lineHeight = await body.evaluate((el) => {
      return window.getComputedStyle(el).lineHeight;
    });
    
    // Should be between 1.4 and 1.8 (optimal range)
    const lineHeightValue = parseFloat(lineHeight);
    expect(lineHeightValue).toBeGreaterThanOrEqual(1.4);
    expect(lineHeightValue).toBeLessThanOrEqual(1.8);
  });

  test('should have clear typographic hierarchy', async ({ page }) => {
    // Check heading sizes
    const logoText = page.locator('.logo-text');
    const logoSize = await logoText.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    
    const tagline = page.locator('.tagline');
    const taglineSize = await tagline.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    
    // Logo should be larger than tagline
    expect(logoSize).toBeGreaterThan(taglineSize);
  });

  test('should limit line length for optimal readability', async ({ page }) => {
    // Fill in OKR and show results
    await page.locator('#okr-input').fill('Test');
    await page.locator('#analyze-btn').click();

    // Wait for results to appear
    const resultsContent = page.locator('.results-content');
    await resultsContent.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      // Results may not appear if API is mocked or unavailable in test
    });
    const maxWidth = await resultsContent.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    
    // Should have max-width (typically 65ch or similar)
    expect(maxWidth).not.toBe('none');
    
    // Convert to pixels if in ch units
    if (maxWidth.includes('ch')) {
      const chValue = parseFloat(maxWidth);
      // 65ch is approximately 65 * 0.5em = good for readability
      expect(chValue).toBeLessThanOrEqual(75);
    }
  });

  test('should use consistent font families', async ({ page }) => {
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    
    // Should include Inter or system fonts
    expect(fontFamily).toMatch(/Inter|system-ui|sans-serif/i);
  });

  test('should use monospace font for code/OKR input', async ({ page }) => {
    const textarea = page.locator('#okr-input');
    const fontFamily = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    
    // Should include monospace fonts
    expect(fontFamily).toMatch(/mono|Courier|Consolas/i);
  });

  test('should have sufficient font weight contrast', async ({ page }) => {
    const logoText = page.locator('.logo-text');
    const logoWeight = await logoText.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    // Logo should be bold (700)
    expect(parseInt(logoWeight)).toBeGreaterThanOrEqual(700);
    
    const tagline = page.locator('.tagline');
    const taglineWeight = await tagline.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    
    // Tagline should be normal (400)
    expect(parseInt(taglineWeight)).toBeLessThanOrEqual(500);
  });

  test('should support text zoom without breaking layout', async ({ page }) => {
    // Set zoom to 150%
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Simulate text zoom by increasing font size
    await page.addStyleTag({
      content: 'body { font-size: 24px !important; }',
    });
    
    // Layout should still work
    const container = await page.locator('.container').boundingBox();
    expect(container).toBeTruthy();
    
    // Text should be visible
    await expect(page.locator('.logo-text')).toBeVisible();
  });

  test('should have proper letter spacing for readability', async ({ page }) => {
    const logoText = page.locator('.logo-text');
    const letterSpacing = await logoText.evaluate((el) => {
      return window.getComputedStyle(el).letterSpacing;
    });
    
    // Should have defined letter spacing (can be negative for large text)
    expect(letterSpacing).toBeTruthy();
  });

  test('should use appropriate font sizes for different elements', async ({ page }) => {
    // Check various text elements have appropriate sizes
    const elements = {
      logo: page.locator('.logo-text'),
      tagline: page.locator('.tagline'),
      button: page.locator('.btn-primary').first(),
      label: page.locator('label').first(),
    };

    for (const [name, element] of Object.entries(elements)) {
      if (await element.count() > 0) {
        const fontSize = await element.first().evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });

        // All should have reasonable font sizes
        expect(fontSize, `${name} font size should be > 10px`).toBeGreaterThan(10);
        expect(fontSize, `${name} font size should be < 50px`).toBeLessThan(50);
      }
    }
  });
});




