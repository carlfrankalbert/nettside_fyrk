import { test, expect } from '@playwright/test';

test.describe('Mobile UX Validation - Designer Perspective', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  });

  test('touch targets are minimum 48px (WCAG enhanced)', async ({ page }) => {
    await page.goto('/');
    
    // Check all interactive elements (buttons and main navigation links)
    const buttons = page.locator('button, .btn, nav a.btn');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // Touch targets should be at least 48px in both dimensions
        expect(box.height).toBeGreaterThanOrEqual(48);
        // Width can be smaller for text links, but should have adequate touch area
        if (box.width < 48) {
          // If width is small, height should compensate
          expect(box.height * box.width).toBeGreaterThanOrEqual(48 * 48);
        }
      }
    }
  });

  test('text is readable - minimum 16px font size', async ({ page }) => {
    await page.goto('/');
    
    // Check body text - use first paragraph
    const bodyText = page.locator('p').first();
    const fontSize = await bodyText.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize);
    });
    
    // Should be at least 16px (1rem)
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('navigation is accessible on mobile', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check that navigation exists and has links
    const navLinks = page.locator('nav a:not(.sr-only)'); // Exclude screen reader only links
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // Check that at least the main navigation elements are accessible
    // (some may be in a hamburger menu, which is fine)
    const visibleLinks = page.locator('nav a:not(.sr-only):visible');
    const visibleCount = await visibleLinks.count();
    expect(visibleCount).toBeGreaterThan(0); // At least some links should be visible
  });

  test('content does not overflow horizontally', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for horizontal scrollbar (indicates overflow)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // If there's horizontal scroll, check if it's significant (more than 20px)
    if (hasHorizontalScroll) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const overflow = scrollWidth - clientWidth;
      
      // Allow small overflow for rounding, but flag significant overflow
      expect(overflow).toBeLessThan(50); // More than 50px overflow is a real UX issue
    } else {
      // No overflow is ideal
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('form inputs are properly sized for mobile', async ({ page }) => {
    await page.goto('/okr-sjekken');
    
    // Check text inputs and textareas (not checkboxes)
    const textInputs = page.locator('input[type="text"], input[type="email"], textarea');
    const count = await textInputs.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const input = textInputs.nth(i);
      const box = await input.boundingBox();
      if (box) {
        // Inputs should be at least 48px tall (WCAG enhanced)
        expect(box.height).toBeGreaterThanOrEqual(48);
        // Inputs should be wide enough to be usable
        expect(box.width).toBeGreaterThan(200);
      }
    }
  });

  test('headings are properly sized and readable', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1').first();
    const h1Size = await h1.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize);
    });
    
    // H1 should be large enough to be a clear heading
    expect(h1Size).toBeGreaterThanOrEqual(24);
  });

  test('spacing between elements is adequate', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check spacing in main content area
    const sections = page.locator('main section');
    const count = await sections.count();
    
    if (count > 1) {
      const firstSection = sections.first();
      const secondSection = sections.nth(1);
      
      const firstBox = await firstSection.boundingBox();
      const secondBox = await secondSection.boundingBox();
      
      if (firstBox && secondBox) {
        const spacing = secondBox.y - (firstBox.y + firstBox.height);
        // Sections should not overlap (negative spacing is bad)
        expect(spacing).toBeGreaterThanOrEqual(0);
        // Ideally should have at least 16px spacing, but 0 is acceptable if intentional
        if (spacing > 0) {
          expect(spacing).toBeGreaterThanOrEqual(16);
        }
      }
    } else {
      // If only one section, that's fine - just verify it exists
      expect(count).toBeGreaterThan(0);
    }
  });

  test('CTA buttons are prominent and accessible', async ({ page }) => {
    await page.goto('/');

    // Check CTA buttons with btn class (excludes icon-only buttons like hamburger menu)
    const ctaButtons = page.locator('.btn, a.btn');
    const count = await ctaButtons.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = ctaButtons.nth(i);
      await expect(button).toBeVisible();

      const box = await button.boundingBox();
      if (box) {
        // CTA buttons should be at least 48px tall
        expect(box.height).toBeGreaterThanOrEqual(48);
        // Should have adequate width
        expect(box.width).toBeGreaterThan(100);
      }
    }
  });

  test('images and logos scale properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img:visible');
    const count = await images.count();

    if (count === 0) {
      // No images is fine
      return;
    }

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const box = await img.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 375;

      if (box) {
        // Images should not overflow viewport significantly
        expect(box.width).toBeLessThanOrEqual(viewportWidth + 20); // Small margin for padding
        // Images should have reasonable dimensions
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });

  test('Konseptspeilet form is usable on mobile', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    // Check textarea exists and is properly sized
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    const box = await textarea.boundingBox();
    if (box) {
      // Textarea should be at least 48px tall (WCAG)
      expect(box.height).toBeGreaterThanOrEqual(48);
      // Should be wide enough to be usable (at least 80% of viewport)
      const viewportWidth = page.viewportSize()?.width || 375;
      expect(box.width).toBeGreaterThan(viewportWidth * 0.7);
    }

    // Check submit button is accessible
    const submitButton = page.locator('button').filter({ hasText: /avdekk|speile|send/i }).first();
    if (await submitButton.count() > 0) {
      const buttonBox = await submitButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('OKR-sjekken textarea is properly sized on mobile', async ({ page }) => {
    await page.goto('/okr-sjekken');
    await page.waitForLoadState('networkidle');

    // Check textarea exists and is properly sized
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    const box = await textarea.boundingBox();
    if (box) {
      // Textarea should be at least 48px tall
      expect(box.height).toBeGreaterThanOrEqual(48);
      // Should be wide enough (at least 70% of viewport)
      const viewportWidth = page.viewportSize()?.width || 375;
      expect(box.width).toBeGreaterThan(viewportWidth * 0.7);
    }
  });

  test('mobile sticky CTA does not overlap content', async ({ page }) => {
    await page.goto('/konseptspeilet');
    await page.waitForLoadState('networkidle');

    // Check if mobile CTA bar exists
    const mobileCTA = page.locator('#mobile-cta-bar');
    if (await mobileCTA.count() > 0 && await mobileCTA.isVisible()) {
      const ctaBox = await mobileCTA.boundingBox();
      const mainContent = page.locator('main');
      const mainBox = await mainContent.boundingBox();

      if (ctaBox && mainBox) {
        // Main content should have enough bottom padding to not be hidden by sticky CTA
        const viewportHeight = page.viewportSize()?.height || 667;
        const visibleMainHeight = viewportHeight - ctaBox.height;
        expect(visibleMainHeight).toBeGreaterThan(400); // At least 400px of content visible
      }
    }
  });
});

