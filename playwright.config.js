import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [['list'], ['html'], ['junit', { outputFile: './test-results/playwright-results.xml' }]] 
    : 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on',
    video: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});