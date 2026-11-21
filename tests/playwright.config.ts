import { defineConfig } from "@playwright/test"
import type { Lane } from "./lib/both"
import { ports } from "./servers.mjs"

// Every test runs twice: against Vite's dev server, which uses Octane's
// development compiler, and against a production build, whose compiler
// memoizes. Each lane serves the fixtures through Octane and through React.
export default defineConfig<{ lane: Lane }>({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  timeout: 20_000,
  expect: { timeout: 3000 },
  use: { trace: "off", actionTimeout: 5000 },
  projects: [
    { name: "dev", use: { lane: "dev" } },
    { name: "prod", use: { lane: "prod" } },
  ],
  webServer: {
    command: "node servers.mjs",
    cwd: import.meta.dirname,
    url: `http://127.0.0.1:${ports.ready}`,
    // `pnpm test:serve` in another terminal, then TEST_REUSE_SERVER=1 pnpm test.
    reuseExistingServer: !!process.env.TEST_REUSE_SERVER,
    gracefulShutdown: { signal: "SIGTERM", timeout: 3000 },
    stdout: "ignore",
    stderr: "pipe",
  },
})
