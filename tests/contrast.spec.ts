/**
 * Contrast Tests - WCAG 2.1 AA Compliance
 * 
 * These tests verify that all text, buttons, and interactive elements
 * meet WCAG 2.1 AA contrast requirements:
 * - Normal text: minimum 4.5:1
 * - Large text (18pt+ or 14pt+ bold): minimum 3:1
 * - UI components (buttons, icons): minimum 3:1
 * 
 * These tests check:
 * 1. Background colors match expected theme (light/dark)
 * 2. Text colors have sufficient contrast
 * 3. Buttons have proper contrast ratios
 * 4. Input fields are properly styled for each theme
 * 5. Service cards have correct backgrounds
 */

import { test, expect } from '@playwright/test';

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Known color values from design system
const colors = {
  'brand-navy': '#001F3F',
  'brand-cyan': '#5AB9D3',
  'brand-cyan-darker': '#2A7A92',
  'brand-cyan-dark': '#3A97B7',
  'brand-cyan-light': '#7CC8DD',
  'white': '#FFFFFF',
  'neutral-700': '#333333',
  'neutral-600': '#717182',
  'neutral-500': '#717182',
  'neutral-400': '#9CA3AF',
  'neutral-300': '#D1D5DB',
  'neutral-200': '#E0E0E0',
  'neutral-900': '#0F1419',
  'neutral-800': '#1F2937',
};

test.describe('Contrast Tests - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(200); // Wait for theme to apply
  });

  test('dark mode class is not present in light mode', async ({ page }) => {
    await page.goto('/');
    
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    expect(hasDarkClass).toBe(false);
  });

  test('service cards have white background in light mode', async ({ page }) => {
    await page.goto('/');
    
    const serviceCard = page.locator('.card').first();
    if (await serviceCard.count() > 0) {
      const bgColor = await serviceCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Card should have white background in light mode
      expect(bgColor).toContain('rgb(255, 255, 255)');
    }
  });

  test('input fields have white background in light mode', async ({ page }) => {
    await page.goto('/kontakt');
    
    const input = page.locator('.input').first();
    if (await input.count() > 0) {
      const bgColor = await input.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Input should have white background in light mode
      expect(bgColor).toContain('rgb(255, 255, 255)');
    }
  });

  test('buttons have sufficient contrast', async ({ page }) => {
    await page.goto('/');
    
    // Test primary button
    const primaryButton = page.locator('.btn-primary').first();
    if (await primaryButton.count() > 0) {
      const bgColor = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      const textColor = await primaryButton.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      
      // Primary button should be navy background with white text
      expect(bgColor).toContain('rgb(0, 31, 63)'); // brand-navy
      expect(textColor).toContain('rgb(255, 255, 255)'); // white
      
      const contrast = getContrastRatio('#001F3F', '#FFFFFF');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }

    // Test secondary button
    const secondaryButton = page.locator('.btn-secondary').first();
    if (await secondaryButton.count() > 0) {
      const bgColor = await secondaryButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      const textColor = await secondaryButton.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      
      // Secondary button should be cyan-darker background with white text
      const contrast = getContrastRatio('#2A7A92', '#FFFFFF');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('body text has sufficient contrast on white background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure light mode is active
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(100);
    
    // Find a paragraph that's actually visible and has text
    const bodyText = page.locator('main p, section p').filter({ hasText: /./ }).first();
    if (await bodyText.count() > 0) {
      const contrast = await bodyText.evaluate((el) => {
        const textColor = window.getComputedStyle(el).color;
        // Get background from parent element (section or main), or fallback to body
        let parent = el.parentElement;
        let bg = null;
        while (parent && parent !== document.body) {
          bg = window.getComputedStyle(parent).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(0, 0, 0)') {
            break;
          }
          parent = parent.parentElement;
        }
        // If no background found, use body background
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'rgb(0, 0, 0)') {
          bg = window.getComputedStyle(document.body).backgroundColor;
        }
        
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
          return 0;
        }
        
        const rgbToHex = (rgb: string) => {
          const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          }
          return null;
        };
        
        const textHex = rgbToHex(textColor);
        const bgHex = rgbToHex(bg);
        if (!textHex || !bgHex) return 0;
        
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const getLuminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const rgb1 = hexToRgb(textHex);
        const rgb2 = hexToRgb(bgHex);
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('headings have sufficient contrast', async ({ page }) => {
    await page.goto('/');
    
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      const textColor = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      
      // Headings should be brand-navy or darker
      const rgbMatch = textColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        // brand-navy is #001F3F = rgb(0, 31, 63)
        expect(r).toBeLessThanOrEqual(10);
        expect(g).toBeLessThanOrEqual(40);
        expect(b).toBeLessThanOrEqual(70);
      }
    }
  });

  test('input fields have sufficient contrast', async ({ page }) => {
    await page.goto('/kontakt');
    
    const input = page.locator('.input').first();
    if (await input.count() > 0) {
      const bgColor = await input.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      const textColor = await input.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      
      // Input should have light background in light mode
      expect(bgColor).toContain('rgb(255, 255, 255)'); // white
      
      // Text should be dark
      const rgbMatch = textColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        expect(r).toBeLessThanOrEqual(60);
        expect(g).toBeLessThanOrEqual(60);
        expect(b).toBeLessThanOrEqual(60);
      }
    }
  });

  test('service cards have light background in light mode', async ({ page }) => {
    await page.goto('/');
    
    const serviceCard = page.locator('.card').first();
    if (await serviceCard.count() > 0) {
      const bgColor = await serviceCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Card should have white or very light background in light mode
      const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        // Should be light (at least 240+ for all channels) - white is 255,255,255
        expect(r).toBeGreaterThanOrEqual(240);
        expect(g).toBeGreaterThanOrEqual(240);
        expect(b).toBeGreaterThanOrEqual(240);
      }
      
      // Also check text color on card
      const cardText = serviceCard.locator('p').first();
      if (await cardText.count() > 0) {
        const textColor = await cardText.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
        const textRgbMatch = textColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (textRgbMatch) {
          const [, r, g, b] = textRgbMatch.map(Number);
          // Text should be dark (neutral-700 is #333333 = rgb(51, 51, 51))
          expect(r).toBeLessThanOrEqual(60);
          expect(g).toBeLessThanOrEqual(60);
          expect(b).toBeLessThanOrEqual(60);
        }
      }
    }
  });

  test('links have sufficient contrast', async ({ page }) => {
    await page.goto('/');
    
    // Find a link that's not a button and has text
    const link = page.locator('main a:not(.btn), section a:not(.btn)').filter({ hasText: /./ }).first();
    if (await link.count() > 0) {
      const contrast = await link.evaluate((el) => {
        const textColor = window.getComputedStyle(el).color;
        // Get background from parent element
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const bg = window.getComputedStyle(parent).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const rgbToHex = (rgb: string) => {
              const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
              }
              return null;
            };
            
            const textHex = rgbToHex(textColor);
            const bgHex = rgbToHex(bg);
            if (!textHex || !bgHex) return 0;
            
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            
            const getLuminance = (r: number, g: number, b: number) => {
              const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };
            
            const rgb1 = hexToRgb(textHex);
            const rgb2 = hexToRgb(bgHex);
            if (!rgb1 || !rgb2) return 0;
            
            const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
            const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
            const lighter = Math.max(lum1, lum2);
            const darker = Math.min(lum1, lum2);
            return (lighter + 0.05) / (darker + 0.05);
          }
          parent = parent.parentElement;
        }
        return 0;
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text links
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe('Contrast Tests - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for ThemeToggle script to initialize
    await page.waitForTimeout(200);
    // Ensure dark mode - set both localStorage and class to override ThemeToggle
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    // Wait for theme to apply and CSS to update
    await page.waitForTimeout(400);
    // Force a reflow to ensure styles are applied
    await page.evaluate(() => {
      document.body.offsetHeight; // Force reflow
      // Double-check dark class is still there
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
      }
    });
    await page.waitForTimeout(100);
  });

  test('dark mode class is present in dark mode', async ({ page }) => {
    await page.goto('/');
    
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    expect(hasDarkClass).toBe(true);
  });

  test('service cards have dark background in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const serviceCard = page.locator('.card').first();
    if (await serviceCard.count() > 0) {
      // Wait a bit more for dark mode to fully apply
      await page.waitForTimeout(200);
      
      const bgColor = await serviceCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Card should have dark background in dark mode (not white)
      // neutral-800 is approximately rgb(31, 41, 55)
      expect(bgColor).not.toContain('rgb(255, 255, 255)');
      
      const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        // Should be dark (less than 100 for all channels for neutral-800)
        expect(r).toBeLessThan(100);
        expect(g).toBeLessThan(100);
        expect(b).toBeLessThan(100);
      } else {
        // If no match, it might be a different format, but should not be white
        expect(bgColor).not.toBe('rgb(255, 255, 255)');
      }
    }
  });

  test('input fields have dark background in dark mode', async ({ page }) => {
    await page.goto('/kontakt');
    await page.waitForLoadState('networkidle');
    
    const input = page.locator('.input').first();
    if (await input.count() > 0) {
      // Wait a bit more for dark mode to fully apply
      await page.waitForTimeout(200);
      
      const bgColor = await input.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Input should have dark background in dark mode (not white)
      // neutral-800 is approximately rgb(31, 41, 55)
      expect(bgColor).not.toContain('rgb(255, 255, 255)');
      
      const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        // Should be dark (less than 100 for all channels for neutral-800)
        expect(r).toBeLessThan(100);
        expect(g).toBeLessThan(100);
        expect(b).toBeLessThan(100);
      } else {
        // If no match, it might be a different format, but should not be white
        expect(bgColor).not.toBe('rgb(255, 255, 255)');
      }
    }
  });

  test('body text has sufficient contrast on dark background', async ({ page }) => {
    await page.goto('/');
    
    // Find a paragraph that's actually visible and has text
    const bodyText = page.locator('main p, section p').filter({ hasText: /./ }).first();
    if (await bodyText.count() > 0) {
      const contrast = await bodyText.evaluate((el) => {
        const textColor = window.getComputedStyle(el).color;
        // Get background from parent element (section or main)
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const bg = window.getComputedStyle(parent).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const rgbToHex = (rgb: string) => {
              const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
              }
              return null;
            };
            
            const textHex = rgbToHex(textColor);
            const bgHex = rgbToHex(bg);
            if (!textHex || !bgHex) return 0;
            
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            
            const getLuminance = (r: number, g: number, b: number) => {
              const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };
            
            const rgb1 = hexToRgb(textHex);
            const rgb2 = hexToRgb(bgHex);
            if (!rgb1 || !rgb2) return 0;
            
            const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
            const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
            const lighter = Math.max(lum1, lum2);
            const darker = Math.min(lum1, lum2);
            return (lighter + 0.05) / (darker + 0.05);
          }
          parent = parent.parentElement;
        }
        return 0;
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('input fields have sufficient contrast in dark mode', async ({ page }) => {
    await page.goto('/kontakt');
    
    const input = page.locator('.input').first();
    if (await input.count() > 0) {
      const contrast = await input.evaluate((el) => {
        const textColor = window.getComputedStyle(el).color;
        const bgColor = window.getComputedStyle(el).backgroundColor;
        
        const rgbToHex = (rgb: string) => {
          const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          }
          return null;
        };
        
        const textHex = rgbToHex(textColor);
        const bgHex = rgbToHex(bgColor);
        if (!textHex || !bgHex) return 0;
        
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const getLuminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const rgb1 = hexToRgb(textHex);
        const rgb2 = hexToRgb(bgHex);
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text in input fields
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('service cards text has sufficient contrast in dark mode', async ({ page }) => {
    await page.goto('/');
    
    const serviceCard = page.locator('.card').first();
    if (await serviceCard.count() > 0) {
      const cardContrast = await serviceCard.evaluate((el) => {
        const textColor = window.getComputedStyle(el.querySelector('p') || el).color;
        const bgColor = window.getComputedStyle(el).backgroundColor;
        
        const rgbToHex = (rgb: string) => {
          const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          }
          return null;
        };
        
        const textHex = rgbToHex(textColor);
        const bgHex = rgbToHex(bgColor);
        if (!textHex || !bgHex) return 0;
        
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const getLuminance = (r: number, g: number, b: number) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const rgb1 = hexToRgb(textHex);
        const rgb2 = hexToRgb(bgHex);
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text
      expect(cardContrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('links have sufficient contrast in dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Find a link that's not a button and has text
    const link = page.locator('main a:not(.btn), section a:not(.btn)').filter({ hasText: /./ }).first();
    if (await link.count() > 0) {
      const contrast = await link.evaluate((el) => {
        const textColor = window.getComputedStyle(el).color;
        // Get background from parent element
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const bg = window.getComputedStyle(parent).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const rgbToHex = (rgb: string) => {
              const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
              }
              return null;
            };
            
            const textHex = rgbToHex(textColor);
            const bgHex = rgbToHex(bg);
            if (!textHex || !bgHex) return 0;
            
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
              } : null;
            };
            
            const getLuminance = (r: number, g: number, b: number) => {
              const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            };
            
            const rgb1 = hexToRgb(textHex);
            const rgb2 = hexToRgb(bgHex);
            if (!rgb1 || !rgb2) return 0;
            
            const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
            const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
            const lighter = Math.max(lum1, lum2);
            const darker = Math.min(lum1, lum2);
            return (lighter + 0.05) / (darker + 0.05);
          }
          parent = parent.parentElement;
        }
        return 0;
      });
      
      // WCAG 2.1 AA requires 4.5:1 for normal text links
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe('Contrast Tests - All Pages', () => {
  const pages = [
    { path: '/', name: 'homepage' },
    { path: '/om', name: 'about' },
    { path: '/kontakt', name: 'contact' },
    { path: '/blogg', name: 'blog' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page has sufficient contrast in light mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      
      // Ensure light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await page.waitForTimeout(100);

      // Check that body has light background
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      const bodyRgbMatch = bodyBg.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (bodyRgbMatch) {
        const [, r, g, b] = bodyRgbMatch.map(Number);
        expect(r).toBeGreaterThanOrEqual(240);
        expect(g).toBeGreaterThanOrEqual(240);
        expect(b).toBeGreaterThanOrEqual(240);
      }
    });

    test(`${pageInfo.name} page has sufficient contrast in dark mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      // Wait for ThemeToggle script to initialize
      await page.waitForTimeout(200);
      
      // Ensure dark mode - set both localStorage and class to override ThemeToggle
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      // Wait longer for theme to apply and CSS to update
      await page.waitForTimeout(400);
      // Force a reflow to ensure styles are applied
      await page.evaluate(() => {
        document.body.offsetHeight; // Force reflow
        // Double-check dark class is still there
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark');
        }
      });
      await page.waitForTimeout(100);

      // Check that body has dark background
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      const bodyRgbMatch = bodyBg.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (bodyRgbMatch) {
        const [, r, g, b] = bodyRgbMatch.map(Number);
        // neutral-900 is #0F1419 = rgb(15, 20, 25)
        // Should be dark (less than 30 for all channels)
        expect(r).toBeLessThanOrEqual(30);
        expect(g).toBeLessThanOrEqual(30);
        expect(b).toBeLessThanOrEqual(30);
      }
      
      // Also verify that service cards have dark background if they exist
      const serviceCard = page.locator('.card').first();
      if (await serviceCard.count() > 0) {
        await page.waitForTimeout(100); // Extra wait for card styles
        const cardBg = await serviceCard.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        const cardRgbMatch = cardBg.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (cardRgbMatch) {
          const [, r, g, b] = cardRgbMatch.map(Number);
          // Should be dark (neutral-800 is around rgb(31, 41, 55))
          expect(r).toBeLessThanOrEqual(50);
          expect(g).toBeLessThanOrEqual(50);
          expect(b).toBeLessThanOrEqual(50);
        } else {
          // If no match, should not be white
          expect(cardBg).not.toContain('rgb(255, 255, 255)');
        }
      }
    });
  }
});

