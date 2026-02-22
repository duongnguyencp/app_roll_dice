import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    // Visual comparisons — update snapshots with: npx playwright test --update-snapshots
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,   // allow 5 % pixel difference (antialiasing, fonts)
      threshold: 0.2,
    },
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  snapshotDir: './tests/e2e/__snapshots__',

  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Slow down video / screenshot recording for CI
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
