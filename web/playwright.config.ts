import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173"
const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:8003"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    cwd: ".",
    url: baseURL,
    reuseExistingServer: !process.env.CI || process.env.E2E_REUSE_SERVER === "true",
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_BACKEND_MODE: "fastapi",
      VITE_API_URL: apiURL,
    },
  },
})
