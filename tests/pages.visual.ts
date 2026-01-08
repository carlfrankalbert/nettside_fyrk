/**
 * Visual Regression Tests - All Pages
 * 
 * These tests verify appearance (element looks correct) against approved baselines.
 * Baseline screenshots represent the approved design.
 * Any visual deviation from baseline must be reviewed and either fixed or approved as new baseline.
 */

import { test, expect } from '@playwright/test';

test.describe('All Pages Visual Regression', () => {
  const pages = [
    { path: '/', name: 'homepage' },
    { path: '/okr-sjekken', name: 'okr-sjekken' },
    { path: '/konseptspeilet', name: 'konseptspeilet' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page visual snapshot`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${pageInfo.name}-page.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

