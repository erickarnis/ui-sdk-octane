// Serves the fixture page four ways, one per lane:
//
//   4410  Octane, Vite dev server   (the development compiler, as `pnpm dev`)
//   4411  React,  Vite dev server
//   4412  Octane, production build  (the compiler that memoizes)
//   4413  React,  production build
//
// The React lanes compile the very same fixture files, with `octane` and the
// adapter swapped for React and @ui-sdk/react, so the two adapters render the
// same components with the same props. `pnpm test` starts this through
// Playwright's `webServer`; run it by hand (`pnpm test:serve`) to open a
// fixture in a browser, like http://127.0.0.1:4410/?fixture=tabs.
import { createServer as createHttpServer } from "node:http"
import { fileURLToPath } from "node:url"
import { build, createServer, preview } from "vite"
import { octane } from "octane/compiler/vite"

const here = (path) => fileURLToPath(new URL(path, import.meta.url))
const root = here("./app")
const host = "127.0.0.1"
export const ports = { octaneDev: 4410, reactDev: 4411, octaneProd: 4412, reactProd: 4413, ready: 4414 }

// Swaps what the fixtures import for React's: `octane` (hooks, createRoot and
// the JSX runtime its pragma names), the adapter under test, and the module
// that says which adapter rendered the page.
function reactOracle() {
  const swaps = new Map([
    [here("../src/primitive.ts"), "@ui-sdk/react/primitive"],
    [here("./app/adapter-name.ts"), here("./app/react/adapter-name.ts")],
  ])
  const bare = new Map([
    ["octane", here("./app/react/octane.ts")],
    ["octane/jsx-runtime", "react/jsx-runtime"],
    ["octane/jsx-dev-runtime", "react/jsx-dev-runtime"],
  ])
  return {
    name: "react-oracle",
    enforce: "pre",
    async resolveId(source, importer, options) {
      const direct = bare.get(source)
      if (direct) return this.resolve(direct, importer, { ...options, skipSelf: true })
      if (!source.startsWith(".")) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      const swap = resolved && swaps.get(resolved.id)
      return swap ? this.resolve(swap, importer, { ...options, skipSelf: true }) : resolved
    },
  }
}

// Core's ready-made primitives the fixtures use, bundled ahead so a dev
// server never finds a new dependency, and reloads the page, mid-test.
const coreEntries = [
  "@ui-sdk/core",
  "@ui-sdk/core/renderer",
  "@ui-sdk/core/agent",
  "@ui-sdk/core/tabs",
  "@ui-sdk/core/accordion",
  "@ui-sdk/core/collapsible",
  "@ui-sdk/core/checkbox",
  "@ui-sdk/core/switch",
  "@ui-sdk/core/radio",
  "@ui-sdk/core/toggle",
  "@ui-sdk/core/listbox",
]

const lanes = {
  octane: {
    plugins: [octane({ requireDirective: true })],
    optimizeDeps: { include: coreEntries, noDiscovery: true },
  },
  react: {
    plugins: [reactOracle()],
    optimizeDeps: {
      include: [...coreEntries, "react", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "@ui-sdk/react/primitive"],
      noDiscovery: true,
    },
  },
}

const config = (adapter, port) => ({
  configFile: false,
  root,
  logLevel: "warn",
  clearScreen: false,
  cacheDir: here(`../node_modules/.vite-tests/${adapter}`),
  ...lanes[adapter],
  resolve: { dedupe: ["@ui-sdk/core", "react", "react-dom"] },
  server: { host, port, strictPort: true, hmr: false, watch: process.env.TEST_WATCH ? {} : null },
  preview: { host, port, strictPort: true },
  build: {
    outDir: here(`../.test-dist/${adapter}`),
    emptyOutDir: true,
    target: "esnext",
    // Readable stack traces when a production-lane test fails.
    minify: false,
    rolldownOptions: {
      // @ui-sdk/react opens its modules with "use client", which means
      // nothing here; the bundler warns once per module that it drops it.
      onLog(level, log, handle) {
        if (log.code !== "MODULE_LEVEL_DIRECTIVE") handle(level, log)
      },
    },
  },
})

async function start() {
  const started = Date.now()
  await Promise.all(["octane", "react"].map((adapter) => build(config(adapter, 0))))
  const servers = await Promise.all([
    createServer(config("octane", ports.octaneDev)).then((server) => server.listen()),
    createServer(config("react", ports.reactDev)).then((server) => server.listen()),
    preview(config("octane", ports.octaneProd)),
    preview(config("react", ports.reactProd)),
  ])
  // Answers once every lane does, for Playwright to wait on.
  const ready = createHttpServer((_request, response) => response.end("ready")).listen(ports.ready, host)
  console.log(`fixture servers ready in ${Date.now() - started}ms on ${host}:${ports.octaneDev}-${ports.reactProd}`)
  const stop = async () => {
    ready.close()
    await Promise.all(servers.map((server) => server.close()))
    process.exit(0)
  }
  process.on("SIGTERM", stop)
  process.on("SIGINT", stop)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await start()
