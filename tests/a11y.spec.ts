/**
 * Accessibility Smoke Tests
 *
 * These tests use axe-core to check for accessibility violations
 * on key pages. Only critical and serious violations will fail the test.
 *
 * Run with: npm run test:a11y
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages to test for accessibility
const PAGES_TO_TEST = [
  { path: '/', name: 'Landing page' },
  { path: '/okr-sjekken', name: 'OKR-sjekken' },
  { path: '/konseptspeilet', name: 'Konseptspeilet' },
];

// Test each page for accessibility violations
for (const page of PAGES_TO_TEST) {
  test(`${page.name} should not have critical accessibility violations`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);

    // Wait for page to be fully loaded
    await browserPage.waitForLoadState('networkidle');

    // Run axe accessibility scan
    const results = await new AxeBuilder({ page: browserPage })
      // Only fail on serious and critical issues
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Filter to only critical and serious violations
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    // Log all violations for debugging (including minor ones)
    if (results.violations.length > 0) {
      console.log(`\n${page.name} - Found ${results.violations.length} total violations:`);
      for (const violation of results.violations) {
        console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
        console.log(`    Help: ${violation.helpUrl}`);
        console.log(`    Affected nodes: ${violation.nodes.length}`);
      }
    }

    // Only fail on critical/serious violations
    expect(
      criticalViolations,
      `Found ${criticalViolations.length} critical/serious accessibility violations on ${page.name}`
    ).toHaveLength(0);
  });
}

// Test color contrast specifically (already covered by wcag2aa, but explicit check)
test('Landing page has sufficient color contrast', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  const seriousContrastIssues = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (seriousContrastIssues.length > 0) {
    console.log('\nSerious color contrast issues found:');
    for (const issue of seriousContrastIssues) {
      for (const node of issue.nodes) {
        console.log(`  Element: ${node.target.join(' ')}`);
        console.log(`  HTML: ${node.html.substring(0, 100)}...`);
      }
    }
  }

  expect(seriousContrastIssues).toHaveLength(0);
});

// Test keyboard navigation on interactive pages
test('OKR-sjekken form is keyboard accessible', async ({ page }) => {
  await page.goto('/okr-sjekken');
  await page.waitForLoadState('networkidle');

  // Check that main interactive elements are focusable
  const textarea = page.locator('textarea').first();
  const submitButton = page.locator('button[type="submit"]').first();

  // Tab to textarea
  await page.keyboard.press('Tab');

  // Verify focus is manageable
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(['TEXTAREA', 'BUTTON', 'INPUT', 'A']).toContain(focusedElement);
});
