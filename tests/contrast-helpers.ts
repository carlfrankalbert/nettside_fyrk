/**
 * Helper utilities for contrast testing
 * These functions are used both in Node.js context and browser context (via page.evaluate)
 */

/**
 * Convert RGB/RGBA string to hex color
 */
export function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return null;
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance for WCAG contrast calculation
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * Returns the contrast ratio (e.g., 4.5:1 returns 4.5)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get background color from element or its parents
 * Returns the first non-transparent background found, or body background as fallback
 */
export function getElementBackground(element: HTMLElement): string {
  let parent: HTMLElement | null = element.parentElement;
  let bg: string | null = null;

  while (parent && parent !== document.body) {
    bg = window.getComputedStyle(parent).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(0, 0, 0)') {
      return bg;
    }
    parent = parent.parentElement;
  }

  // Fallback to body background
  bg = window.getComputedStyle(document.body).backgroundColor;
  return bg || 'rgb(255, 255, 255)'; // Default to white if still not found
}

/**
 * Calculate contrast ratio between element text and its background
 * This function is designed to be used in page.evaluate() context
 */
export const calculateElementContrast = `
  (function() {
    function rgbToHex(rgb) {
      const match = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return '#' + r + g + b;
      }
      return null;
    }
    
    function hexToRgb(hex) {
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }
    
    function getLuminance(r, g, b) {
      const rs = r / 255;
      const gs = g / 255;
      const bs = b / 255;
      const rL = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
      const gL = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
      const bL = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
      return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    }
    
    return function(el) {
      const textColor = window.getComputedStyle(el).color;
      let parent = el.parentElement;
      let bg = null;
      
      while (parent && parent !== document.body) {
        bg = window.getComputedStyle(parent).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(0, 0, 0)') {
          break;
        }
        parent = parent.parentElement;
      }
      
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'rgb(0, 0, 0)') {
        bg = window.getComputedStyle(document.body).backgroundColor;
      }
      
      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        return 0;
      }
      
      const textHex = rgbToHex(textColor);
      const bgHex = rgbToHex(bg);
      if (!textHex || !bgHex) return 0;
      
      const rgb1 = hexToRgb(textHex);
      const rgb2 = hexToRgb(bgHex);
      if (!rgb1 || !rgb2) return 0;
      
      const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
      const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    };
  })()
`;

/**
 * Setup theme for testing
 * This function ensures the theme is properly set and waits for CSS to apply
 * 
 * Note: ThemeToggle script may interfere, so we set it multiple times and wait longer
 */
export async function setupTheme(page: any, theme: 'light' | 'dark'): Promise<void> {
  await page.waitForLoadState('networkidle');
  
  if (theme === 'dark') {
    // First, try to prevent ThemeToggle from interfering by setting localStorage early
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    // Wait for ThemeToggle script to initialize
    await page.waitForTimeout(400);
    
    // Set theme multiple times to ensure it sticks
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForTimeout(600);
    
    // Force reflow and verify multiple times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        document.body.offsetHeight; // Force reflow
        // Ensure dark class is still there
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark');
        }
        // Also ensure localStorage is set
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(200);
    }
    
    // Final verification - if still not set, try one more aggressive approach
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    
    if (!hasDarkClass) {
      // Remove ThemeToggle event listeners if possible and force dark mode
      await page.evaluate(() => {
        // Try to find and remove theme toggle button to prevent interference
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
          const newToggle = toggle.cloneNode(true);
          toggle.parentNode?.replaceChild(newToggle, toggle);
        }
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(300);
    }
  } else {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(200);
  }
}

