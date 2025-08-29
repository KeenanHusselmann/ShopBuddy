import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for slow execution tests
 * This configuration adds delays and slower timeouts for testing purposes
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel execution for slow tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduce retries for slow tests
  /* Opt out of parallel tests on CI. */
  workers: 1, // Force single worker for slow tests
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Slow down Playwright operations by 1000ms */
    launchOptions: {
      slowMo: 1000,
    },
    
    /* Increase timeouts for slow execution */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-slow',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional slow execution settings
        launchOptions: {
          slowMo: 1000,
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /* Global test timeout */
  timeout: 300000, // 5 minutes global timeout
  
  /* Global expect timeout */
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },
});
