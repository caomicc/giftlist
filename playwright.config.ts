import { defineConfig, devices } from '@playwright/test'
import { PORT, e2eServerEnv } from './e2e/local-env'

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/en/auth/signin`,
    // Never reuse: a server already on this port may have been started against production.
    reuseExistingServer: false,
    env: e2eServerEnv,
    timeout: 120_000,
  },
})
