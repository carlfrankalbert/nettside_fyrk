import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || (process.env.CI ? 'https://fyrk.no' : 'http://localhost:4321'),
    trace: 'on-first-retry',
  },

  projects: [
    // Smoke tests - daily
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
    // Add more configurations as needed based on analytics
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

