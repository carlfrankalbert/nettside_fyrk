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

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'smoke',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Chromium-based mobile device, so CI only needs one browser engine
    {
      name: 'smoke-mobile',
      testMatch: /.*\.smoke\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'a11y',
      testMatch: /a11y\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
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
        // The Astro dev toolbar is a dev-only overlay. Keep it out of
        // accessibility scans.
        env: { ASTRO_DEV_TOOLBAR: 'false' },
      },
});

