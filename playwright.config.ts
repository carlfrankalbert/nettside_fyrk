import { defineConfig, devices } from '@playwright/test';

const LOCAL_BASE_URL = 'http://localhost:4321';

// Tests run against the local app under test, so a pull request is verified by
// its own code. Workflows that deliberately check the deployed site (daily
// smoke test) set PLAYWRIGHT_TEST_BASE_URL themselves.
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || LOCAL_BASE_URL;
const isExternalUrl = !baseURL.includes('localhost');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Use project name in snapshot path instead of OS, so baselines work across macOS and Linux CI
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    // Smoke tests
    {
      name: 'smoke',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'smoke-mobile',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'smoke-tablet',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['iPad Pro'] },
    },

    // Visual regression - monthly, top configurations
    {
      name: 'visual',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-firefox',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'visual-safari',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'visual-iphone14',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'visual-pixel7',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'visual-ipad',
      testMatch: /.*\.visual\.ts/,
      use: { ...devices['iPad Pro'] },
    },
    // Mobile visual tests
    {
      name: 'visual-mobile',
      testMatch: /mobile\.visual\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    // Mobile UX tests
    {
      name: 'ux-mobile',
      testMatch: /mobile\.ux\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    // Contrast tests - accessibility
    {
      name: 'contrast',
      testMatch: /contrast\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // OKR-sjekken API tests
    {
      name: 'okr-api',
      testMatch: /okr-sjekken\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Accessibility tests with axe-core
    {
      name: 'a11y',
      testMatch: /a11y\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Konseptspeilet E2E tests
    {
      name: 'konseptspeilet',
      testMatch: /konseptspeilet\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Pre-Mortem Brief E2E tests
    {
      name: 'pre-mortem',
      testMatch: /pre-mortem\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Security tests
    {
      name: 'security',
      testMatch: /security\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Streaming resilience tests
    {
      name: 'streaming',
      testMatch: /streaming-resilience\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Safari smoke tests (catches Safari-specific rendering bugs)
    {
      name: 'safari',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
    // Add more configurations as needed based on analytics
  ],

  // Only start local server when not testing against an external URL
  webServer: isExternalUrl
    ? undefined
    : {
        // --ignore-lock keeps the server in the foreground. Astro 7 otherwise
        // detaches `astro dev` when an AI agent runs it, and Playwright then
        // sees the process exit. Playwright owns this server's lifecycle.
        command: 'npm run dev -- --ignore-lock',
        url: LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        // The Astro dev toolbar is a dev-only overlay. Keep it out of visual
        // baselines and accessibility scans.
        env: { ASTRO_DEV_TOOLBAR: 'false' },
      },
});

