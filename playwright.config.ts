import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      process.env.E2E_PRODUCTION === '1'
        ? 'node scripts/start.mjs'
        : 'node node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: `./data/e2e-${process.pid}.db`,
      PORT: '4173',
      HOST: '127.0.0.1',
      ORIGIN: 'http://127.0.0.1:4173'
    },
    timeout: 120000
  }
});
