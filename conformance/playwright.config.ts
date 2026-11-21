// Runs UI SDK's own Playwright specs (`.upstream/tests/specs`) against this
// adapter and against @ui-sdk/react, the oracle. Both projects ask the page
// for React's fixtures: ../vite.config.ts decides which adapter renders them.
// So upstream's specs run unchanged, their React-only branches included, and
// a spec that fails on `octane` and passes on `react` is this adapter's.
//
//   pnpm conformance            builds both pages and runs everything
//   pnpm conformance tabs       one component's specs
import { defineConfig } from "@playwright/test"
import {
  countGates,
  kitchenSinks,
  specsThatSkip,
} from "../.upstream/tests/fixture-files"

type Options = {
  framework: string
  fixtureOptions: Record<string, string>
  playground: boolean
}

// CONFORMANCE_PORT moves both pages, as in vite.config.ts.
const port = Number(process.env.CONFORMANCE_PORT ?? 4490)
const origins = {
  octane: `http://localhost:${port}`,
  react: `http://localhost:${port + 1}`,
}
const adapters = (process.env.CONFORMANCE_ADAPTERS ?? "octane,react")
  .split(",")
  .filter((name): name is keyof typeof origins => name in origins)

// The popups that can present as a sheet, and the ones that can render into
// a container, as upstream's own config lists them.
const sheetSpecs = ["menu", "popover", "dialog", "select", "combobox", "autocomplete"].map(
  (component) => `**/${component}.spec.ts`
)
const portalSpecs = [
  "alignment", "autocomplete", "combobox", "command", "date-picker", "dialog", "drawer",
  "hover-card", "list", "menu", "menubar", "navigation-menu", "popover", "popup",
  "presentation", "select", "toast", "token-input", "tooltip", "trigger-menu",
].map((component) => `**/${component}.*spec.ts`)

const preview = (adapter: keyof typeof origins) => ({
  command: `CONFORMANCE_ADAPTER=${adapter} node ../node_modules/vite/bin/vite.js preview --config vite.config.ts`,
  url: origins[adapter],
  reuseExistingServer: true,
  stdout: "ignore" as const,
  stderr: "pipe" as const,
})

export default defineConfig<Options>({
  testDir: "../.upstream/tests/specs",
  outputDir: "../test-results/conformance",
  fullyParallel: true,
  reporter: process.env.CONFORMANCE_REPORT
    ? [["json", { outputFile: process.env.CONFORMANCE_REPORT }], ["dot"]]
    : [["list"]],
  use: { browserName: "chromium", trace: "off", playground: true },
  projects: adapters.flatMap((adapter) => [
    {
      name: adapter,
      use: { baseURL: origins[adapter], framework: "react" },
      testIgnore: specsThatSkip("react"),
    },
    {
      name: `${adapter}-data`,
      use: { baseURL: origins[adapter], framework: "react-data" },
      testIgnore: specsThatSkip("react-data"),
    },
    {
      name: `${adapter}-portal`,
      use: {
        baseURL: origins[adapter],
        framework: "react",
        fixtureOptions: { container: "portal-root" },
      },
      testMatch: portalSpecs,
      testIgnore: [kitchenSinks, countGates, ...specsThatSkip("react")],
    },
    // Upstream's server-rendering specs, against its react-ssr fixtures. On
    // the Octane page those take their HTML from the preview server's /__ssr
    // route (see ../vite.config.ts).
    {
      name: `${adapter}-ssr`,
      use: { baseURL: origins[adapter], framework: "react-ssr" },
      testIgnore: specsThatSkip("react-ssr"),
    },
    {
      name: `${adapter}-sheet`,
      use: {
        baseURL: origins[adapter],
        framework: "react",
        fixtureOptions: { presentation: "sheet" },
      },
      testMatch: sheetSpecs,
      testIgnore: specsThatSkip("react"),
    },
  ]),
  webServer: adapters.map(preview),
})
