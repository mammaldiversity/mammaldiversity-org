import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const testPort = process.env.PLAYWRIGHT_PORT ?? "4321";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${testPort}/`,
    trace: "on-first-retry",
    actionTimeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `ASTRO_DEV_BACKGROUND=1 bun run dev -- --port ${testPort}`,
    url: `http://localhost:${testPort}/`,
    reuseExistingServer: !isCI,
    timeout: 60000,
    stdout: isCI ? "ignore" : "pipe",
    stderr: "pipe",
  },
});
