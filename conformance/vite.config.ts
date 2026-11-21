// Builds the conformance page (./app) for one adapter:
//
//   CONFORMANCE_ADAPTER=octane  this package, with upstream's React fixtures
//                               compiled as Octane modules
//   CONFORMANCE_ADAPTER=react   @ui-sdk/react as published, the oracle
//
// Both serve the same fixtures from `.upstream/` and the same published
// @ui-sdk/core, so a spec that fails only on the Octane build is this
// adapter's doing.
import { readdirSync, realpathSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import tailwind from "@tailwindcss/vite"
import { octane } from "octane/compiler/vite"
import { defineConfig, type Plugin } from "vite"

const adapter = process.env.CONFORMANCE_ADAPTER === "react" ? "react" : "octane"
const here = fileURLToPath(new URL(".", import.meta.url))
const repo = path.dirname(here.replace(/\/$/, ""))
const upstream = path.join(repo, ".upstream")
const fixtures = path.join(upstream, "apps/playground/src/fixtures") + "/"
const source = path.join(repo, "src")
// CONFORMANCE_PORT moves both pages, so two checkouts can run at once.
const port = Number(process.env.CONFORMANCE_PORT ?? 4490)
const ports = { octane: port, react: port + 1 }

// Core's own modules by file name, for specs that reach into core. They are
// imported by path, since core's package exports only its entries, and it is
// the path the adapter's imports resolve to, so a spec sees the instances the
// fixture uses.
function coreModules(): Plugin {
  const require = createRequire(import.meta.url)
  const dist = path.dirname(realpathSync(require.resolve("@ui-sdk/core")))
  const foundation = path.join(dist, "foundation")
  const entries = readdirSync(foundation).flatMap((area) =>
    readdirSync(path.join(foundation, area))
      .filter((file) => file.endsWith(".js"))
      .map(
        (file) =>
          `${JSON.stringify(file.slice(0, -3))}: () => import(${JSON.stringify(path.join(foundation, area, file))})`
      )
  )
  return {
    name: "conformance:core-modules",
    resolveId: (id) => (id === "virtual:core-modules" ? "\0core-modules" : null),
    load: (id) =>
      id === "\0core-modules" ? `export default {\n${entries.join(",\n")}\n}` : null,
  }
}

// Upstream's React fixtures as Octane modules: the imports point at Octane and
// at this package, and what React spells differently is respelled. Anything a
// fixture needs beyond this is a difference worth knowing about, so the list
// stays short and each line says what it is for.
function reactFixturesAsOctane(): Plugin {
  return {
    name: "conformance:react-fixtures-as-octane",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?", 1)[0] ?? id
      if (!file.startsWith(fixtures) || !/\.tsx?$/.test(file)) return null
      const respelled = code
        .replace(/from "react-dom\/client"/g, 'from "octane"')
        .replace(/from "react-dom\/server"/g, 'from "octane/server"')
        .replace(/from "react-dom"/g, 'from "octane"')
        .replace(/from "react"/g, 'from "octane"')
        .replace(/from "@ui-sdk\/react\/primitive"/g, `from "${source}/primitive.ts"`)
        .replace(
          /from "@ui-sdk\/react\/([a-z-]+)"/g,
          (_, name: string) => `from "${source}/components/${name}.ts"`
        )
        // React's onChange on a text field is the browser's input event.
        .replace(/\bonChange=/g, "onInput=")
        // An Octane context is its own provider.
        .replace(/<(\/?)([A-Za-z.]+)\.Provider\b/g, "<$1$2")
      // Octane has no <Profiler>: see app/profiler.ts.
      const profiled = respelled.includes("React.Profiler")
        ? `import { Profiler as ConformanceProfiler } from "${path.join(here, "app/profiler.ts")}"\n${respelled.replace(/\bReact\.Profiler\b/g, "ConformanceProfiler")}`
        : respelled
      return { code: `/** @jsxImportSource octane */\n${profiled}`, map: null }
    },
  }
}

// Serves ./app/index.html at `/` although the project's root is the
// repository: Octane's compiler takes a file as the project's own, and so
// compiles it, only when it is under Vite's root, and the fixtures are in
// `.upstream/`.
function appAtRoot(): Plugin {
  const page = "/conformance/app/index.html"
  return {
    name: "conformance:app-at-root",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const [pathname, search = ""] = (request.url ?? "/").split("?")
        if (pathname === "/") request.url = `${page}${search && "?" + search}`
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const [pathname, search = ""] = (request.url ?? "/").split("?")
        if (pathname === "/") request.url = `${page}${search && "?" + search}`
        next()
      })
    },
  }
}

export default defineConfig({
  root: repo,
  plugins: [
    appAtRoot(),
    coreModules(),
    ...(adapter === "octane" ? [reactFixturesAsOctane(), octane({ requireDirective: true })] : []),
    tailwind(),
  ],
  resolve: {
    alias: [{ find: /^tests\/fixtures\/(.*)$/, replacement: path.join(upstream, "tests/fixtures") + "/$1" }],
    // One copy of each, whichever file asks.
    dedupe: ["react", "react-dom", "octane", "@ui-sdk/core"],
  },
  server: { port: ports[adapter], host: "localhost", strictPort: true },
  preview: { port: ports[adapter], host: "localhost", strictPort: true },
  build: {
    outDir: path.join(repo, ".conformance-dist", adapter),
    emptyOutDir: true,
    rollupOptions: { input: path.join(here, "app/index.html") },
    target: "esnext",
    minify: false,
  },
})
