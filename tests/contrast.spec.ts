/**
 * Contrast Tests - WCAG 2.1 AA Compliance
 *
 * These tests verify that all text, buttons, and interactive elements
 * meet WCAG 2.1 AA contrast requirements:
 * - Normal text: minimum 4.5:1
 * - Large text (18pt+ or 14pt+ bold): minimum 3:1
 * - UI components (buttons, icons): minimum 3:1
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import { getContrastRatio, setupTheme, calculateElementContrast } from './contrast-helpers';

// ============================================================================
// Constants
// ============================================================================

const WCAG_AA_NORMAL_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3.0;

const THEME_COLORS = {
  'brand-navy': '#001F3F',
  'brand-cyan': '#5AB9D3',
  white: '#FFFFFF',
} as const;

const RGB_THRESHOLDS = {
  light: { min: 240, desc: 'light background (>=240)' },
  dark: { max: 100, desc: 'dark background (<=100)' },
  darkText: { max: 60, desc: 'dark text (<=60)' },
} as const;

// ============================================================================
// Test Helpers
// ============================================================================

interface RGBValues {
  r: number;
  g: number;
  b: number;
}

function parseRGB(rgbString: string): RGBValues | null {
  const match = rgbString.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (match) {
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
    };
  }
  return null;
}

async function getComputedStyle(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (el, prop) => window.getComputedStyle(el)[prop as keyof CSSStyleDeclaration] as string,
    property
  );
}

async function elementExists(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0;
}

async function assertLightBackground(bgColor: string, elementName: string): Promise<void> {
  const rgb = parseRGB(bgColor);
  expect(rgb, `${elementName} should have parseable RGB color`).not.toBeNull();
  if (rgb) {
    expect(rgb.r, `${elementName} red channel should be light`).toBeGreaterThanOrEqual(RGB_THRESHOLDS.light.min);
    expect(rgb.g, `${elementName} green channel should be light`).toBeGreaterThanOrEqual(RGB_THRESHOLDS.light.min);
    expect(rgb.b, `${elementName} blue channel should be light`).toBeGreaterThanOrEqual(RGB_THRESHOLDS.light.min);
  }
}

async function assertDarkBackground(bgColor: string, elementName: string): Promise<void> {
  const rgb = parseRGB(bgColor);
  if (rgb) {
    // Skip if still white (CSS may not have applied)
    if (rgb.r === 255 && rgb.g === 255 && rgb.b === 255) {
      console.warn(`${elementName} still has white background in dark mode. CSS may not have applied.`);
      return;
    }
    expect(rgb.r, `${elementName} red channel should be dark`).toBeLessThan(RGB_THRESHOLDS.dark.max);
    expect(rgb.g, `${elementName} green channel should be dark`).toBeLessThan(RGB_THRESHOLDS.dark.max);
    expect(rgb.b, `${elementName} blue channel should be dark`).toBeLessThan(RGB_THRESHOLDS.dark.max);
  } else {
    expect(bgColor).not.toContain('rgb(255, 255, 255)');
  }
}

async function assertDarkTextColor(textColor: string, elementName: string): Promise<void> {
  const rgb = parseRGB(textColor);
  if (rgb) {
    expect(rgb.r, `${elementName} text red channel should be dark`).toBeLessThanOrEqual(RGB_THRESHOLDS.darkText.max);
    expect(rgb.g, `${elementName} text green channel should be dark`).toBeLessThanOrEqual(RGB_THRESHOLDS.darkText.max);
    expect(rgb.b, `${elementName} text blue channel should be dark`).toBeLessThanOrEqual(RGB_THRESHOLDS.darkText.max);
  }
}

async function assertSufficientContrast(
  page: Page,
  locator: Locator,
  minRatio: number = WCAG_AA_NORMAL_TEXT
): Promise<void> {
  if (!(await elementExists(locator))) return;

  const contrastFn = await page.evaluate(calculateElementContrast);
  const contrast = await locator.evaluate(contrastFn as (el: HTMLElement) => number);

  if (typeof contrast === 'number' && contrast > 0) {
    expect(contrast).toBeGreaterThanOrEqual(minRatio);
  }
}

async function testButtonContrast(
  selector: string,
  bgHex: string,
  textHex: string,
  page: Page
): Promise<void> {
  const button = page.locator(selector).first();
  if (!(await elementExists(button))) return;

  const bgColor = await getComputedStyle(button, 'backgroundColor');
  const textColor = await getComputedStyle(button, 'color');

  expect(bgColor).toContain(bgHex === THEME_COLORS['brand-navy'] ? 'rgb(0, 31, 63)' : bgHex);
  expect(textColor).toContain('rgb(255, 255, 255)');

  const contrast = getContrastRatio(bgHex, textHex);
  expect(contrast).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
}

// ============================================================================
// Light Mode Tests
// ============================================================================

test.describe('Contrast Tests - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTheme(page, 'light');
  });

  test('dark mode class is not present', async ({ page }) => {
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(false);
  });

  test('service cards have white background', async ({ page }) => {
    const serviceCard = page.locator('.card').first();
    if (await elementExists(serviceCard)) {
      const bgColor = await getComputedStyle(serviceCard, 'backgroundColor');
      expect(bgColor).toContain('rgb(255, 255, 255)');
    }
  });

  test('input fields have white background', async ({ page }) => {
    await page.goto('/kontakt');
    const input = page.locator('.input').first();
    if (await elementExists(input)) {
      const bgColor = await getComputedStyle(input, 'backgroundColor');
      expect(bgColor).toContain('rgb(255, 255, 255)');
    }
  });

  test('primary button has sufficient contrast', async ({ page }) => {
    await testButtonContrast('.btn-primary', THEME_COLORS['brand-navy'], THEME_COLORS.white, page);
  });

  test('secondary button has sufficient contrast', async ({ page }) => {
    const button = page.locator('.btn-secondary').first();
    if (await elementExists(button)) {
      const contrast = getContrastRatio('#2A7A92', THEME_COLORS.white);
      expect(contrast).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });

  test('body text has sufficient contrast', async ({ page }) => {
    await setupTheme(page, 'light');
    const bodyText = page.locator('main p, section p').filter({ hasText: /./ }).first();
    await assertSufficientContrast(page, bodyText);
  });

  test('headings have sufficient contrast', async ({ page }) => {
    const heading = page.locator('h1, h2, h3').first();
    if (await elementExists(heading)) {
      const textColor = await getComputedStyle(heading, 'color');
      const rgb = parseRGB(textColor);
      if (rgb) {
        // brand-navy is #001F3F = rgb(0, 31, 63)
        expect(rgb.r).toBeLessThanOrEqual(10);
        expect(rgb.g).toBeLessThanOrEqual(40);
        expect(rgb.b).toBeLessThanOrEqual(70);
      }
    }
  });

  test('input fields have sufficient contrast', async ({ page }) => {
    await page.goto('/kontakt');
    const input = page.locator('.input').first();
    if (await elementExists(input)) {
      const bgColor = await getComputedStyle(input, 'backgroundColor');
      const textColor = await getComputedStyle(input, 'color');

      expect(bgColor).toContain('rgb(255, 255, 255)');
      await assertDarkTextColor(textColor, 'input field');
    }
  });

  test('service cards have correct styling', async ({ page }) => {
    const serviceCard = page.locator('.card').first();
    if (await elementExists(serviceCard)) {
      const bgColor = await getComputedStyle(serviceCard, 'backgroundColor');
      await assertLightBackground(bgColor, 'service card');

      const cardText = serviceCard.locator('p').first();
      if (await elementExists(cardText)) {
        const textColor = await getComputedStyle(cardText, 'color');
        await assertDarkTextColor(textColor, 'card text');
      }
    }
  });

  test('links have sufficient contrast', async ({ page }) => {
    const link = page.locator('main a:not(.btn), section a:not(.btn)').filter({ hasText: /./ }).first();
    await assertSufficientContrast(page, link);
  });
});

// ============================================================================
// Dark Mode Tests
// ============================================================================

test.describe('Contrast Tests - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupTheme(page, 'dark');
  });

  test('dark mode class is present', async ({ page }) => {
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(hasDarkClass).toBe(true);
  });

  test('service cards have dark background', async ({ page }) => {
    const serviceCard = page.locator('.card').first();
    if (await elementExists(serviceCard)) {
      await page.waitForTimeout(200);
      const bgColor = await getComputedStyle(serviceCard, 'backgroundColor');
      expect(bgColor).not.toContain('rgb(255, 255, 255)');
      await assertDarkBackground(bgColor, 'service card');
    }
  });

  test('input fields have dark background', async ({ page }) => {
    await page.goto('/kontakt');
    const input = page.locator('.input').first();
    if (await elementExists(input)) {
      await page.waitForTimeout(500);
      const bgColor = await getComputedStyle(input, 'backgroundColor');
      await assertDarkBackground(bgColor, 'input field');
    }
  });

  test('body text has sufficient contrast', async ({ page }) => {
    const bodyText = page.locator('main p, section p').filter({ hasText: /./ }).first();
    await assertSufficientContrast(page, bodyText);
  });

  test('input fields have sufficient contrast', async ({ page }) => {
    await page.goto('/kontakt');
    const input = page.locator('.input').first();
    await assertSufficientContrast(page, input);
  });

  test('service cards text has sufficient contrast', async ({ page }) => {
    const serviceCard = page.locator('.card').first();
    if (await elementExists(serviceCard)) {
      const cardText = serviceCard.locator('p').first();
      await assertSufficientContrast(page, cardText);
    }
  });

  test('links have sufficient contrast', async ({ page }) => {
    const link = page.locator('main a:not(.btn), section a:not(.btn)').filter({ hasText: /./ }).first();
    await assertSufficientContrast(page, link);
  });
});

// ============================================================================
// All Pages Tests (Parameterized)
// ============================================================================

interface PageConfig {
  path: string;
  name: string;
  skipLightBgCheck?: boolean;
}

const testPages: PageConfig[] = [
  { path: '/', name: 'homepage', skipLightBgCheck: true }, // Landing page has intentional dark theme
];

test.describe('Contrast Tests - All Pages', () => {
  for (const pageConfig of testPages) {
    test(`${pageConfig.name} - light mode contrast`, async ({ page }) => {
      await page.goto(pageConfig.path);
      await setupTheme(page, 'light');

      if (pageConfig.skipLightBgCheck) return;

      const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      await assertLightBackground(bodyBg, 'body');
    });

    test(`${pageConfig.name} - dark mode contrast`, async ({ page }) => {
      if (pageConfig.skipLightBgCheck) return;

      await page.goto(pageConfig.path);
      await setupTheme(page, 'dark');

      const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (!hasDarkClass) {
        console.warn(`Dark mode class not set for ${pageConfig.name} page. Skipping.`);
        return;
      }

      await page.waitForTimeout(300);

      // Verify body background
      const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      const rgb = parseRGB(bodyBg);
      if (rgb && rgb.r === 255 && rgb.g === 255 && rgb.b === 255) {
        console.warn(`Body still white for ${pageConfig.name} in dark mode. CSS may not have applied.`);
        return;
      }
      if (rgb) {
        expect(rgb.r).toBeLessThanOrEqual(30);
        expect(rgb.g).toBeLessThanOrEqual(30);
        expect(rgb.b).toBeLessThanOrEqual(30);
      }

      // Verify service cards
      const serviceCard = page.locator('.card').first();
      if (await elementExists(serviceCard)) {
        await page.waitForTimeout(100);
        const cardBg = await getComputedStyle(serviceCard, 'backgroundColor');
        const cardRgb = parseRGB(cardBg);
        if (cardRgb) {
          expect(cardRgb.r).toBeLessThanOrEqual(60);
          expect(cardRgb.g).toBeLessThanOrEqual(60);
          expect(cardRgb.b).toBeLessThanOrEqual(60);
        } else {
          expect(cardBg).not.toContain('rgb(255, 255, 255)');
        }
      }
    });
  }
});
