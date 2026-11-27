// Builds the conformance page (./app) for one adapter:
//
//   CONFORMANCE_ADAPTER=octane  this package, with upstream's React fixtures
//                               compiled as Octane modules
//   CONFORMANCE_ADAPTER=react   @ui-sdk/react as published, the oracle
//
// Both serve the same fixtures from `.upstream/` and the same published
// @ui-sdk/core, so a spec that fails only on the Octane build is this
// adapter's doing.
//
// `vite build --ssr` with CONFORMANCE_ADAPTER=octane builds app/server.tsx,
// the fixtures compiled for the server, which the Octane page's preview server
// renders for upstream's server-rendering specs (see serverRenderRoute).
import { execFile } from "node:child_process"
import { existsSync, readdirSync, realpathSync } from "node:fs"
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

// A component's file: `.tsx` once it is written with templates, `.ts` until
// then, so files can move to the new format one at a time.
const componentFile = (name: string) =>
  [".tsx", ".ts"]
    .map((extension) => path.join(source, "components", name + extension))
    .find((file) => existsSync(file)) ?? path.join(source, "components", `${name}.ts`)
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
    transform(code, id, options) {
      const file = id.split("?", 1)[0] ?? id
      if (!file.startsWith(fixtures) || !/\.tsx?$/.test(file)) return null
      const respelled = code
        // A fixture's mount, which the server never calls, makes a client
        // root, and octane/server has none.
        .replace(
          /from "react-dom\/client"/g,
          options?.ssr ? `from "${path.join(here, "app/no-client-roots.ts")}"` : 'from "octane"'
        )
        .replace(/from "react-dom\/server"/g, 'from "octane/server"')
        .replace(/from "react-dom"/g, 'from "octane"')
        .replace(/from "react"/g, 'from "octane"')
        .replace(/from "@ui-sdk\/react\/primitive"/g, `from "${source}/primitive.ts"`)
        .replace(
          /from "@ui-sdk\/react\/([a-z-]+)"/g,
          (_, name: string) => `from "${componentFile(name)}"`
        )
        // React's onChange on a text field is the browser's input event.
        .replace(/\bonChange=/g, "onInput=")
        // The same, as a key of props spread onto a field (trigger-menu's
        // controlled field). Only a handler of an event: toast's shell has
        // an onChange of its own.
        .replace(/\bonChange:(\s*\(event\b)/g, "onInput:$1")
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

// On the Octane page, a `react-ssr.tsx` fixture takes its HTML from the
// server instead of rendering it in the browser: Octane compiles a module
// differently for the server and the client, so the client build of a
// fixture cannot be passed to octane/server's renderToString. The rest of the
// fixture stays as upstream wrote it, so it records and hydrates the HTML
// as it does on React.
function serverRenderedFixtures(): Plugin {
  const fetched = `import { serverHtml as __conformanceServerHtml } from "${path.join(here, "app/server-html.ts")}"\n`
  return {
    name: "conformance:server-rendered-fixtures",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?", 1)[0] ?? id
      if (!file.startsWith(fixtures) || !file.endsWith("/react-ssr.tsx")) return null
      const swapped = code
        .replace(/^import \{ renderToString \} from "react-dom\/server"\n/m, fetched)
        .replace(
          /^function mount\(root: HTMLElement\) \{\n/m,
          `async function mount(root: HTMLElement) {\n  const __conformanceHtml = await __conformanceServerHtml(${fixtureProps(code, file)})\n`
        )
        .replace(/\brenderToString\(app\)/g, "__conformanceHtml")
      if (/\brenderToString\b/.test(swapped) || !swapped.includes("__conformanceHtml"))
        throw new Error(`${file} renders on the page in a way this plugin does not know.`)
      return { code: swapped, map: null }
    },
  }
}

// The props a react-ssr fixture gives its Fixture, as an object expression the
// page evaluates as the fixture does and sends to the server, which renders
// the Fixture with them. Two fixtures pass `data`, written `name={expression}`.
function fixtureProps(code: string, file: string): string {
  const element = /<Fixture\b([^>]*?)\/>/.exec(code)?.[1] ?? ""
  const props = [...element.matchAll(/(\w+)=\{([^{}]*)\}/g)]
  if (element.replace(/(\w+)=\{([^{}]*)\}/g, "").trim())
    throw new Error(`${file} gives its Fixture props this plugin does not read.`)
  return `{ ${props.map(([, name, value]) => `${name}: ${value}`).join(", ")} }`
}

// Answers `/__ssr?fixture=<name>&url=<page url>&props=<JSON>` on the Octane preview server
// with the fixture rendered by the `vite build --ssr` output, as upstream's
// playground answers it for Vue and Svelte. See render.mjs for why each
// render is its own process.
function serverRenderRoute(): Plugin {
  const renderer = path.join(here, "render.mjs")
  return {
    name: "conformance:server-render-route",
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost")
        if (url.pathname !== "/__ssr") return next()
        const fixture = url.searchParams.get("fixture")
        const page = url.searchParams.get("url")
        const props = url.searchParams.get("props") ?? "{}"
        if (!fixture || !page) {
          response.statusCode = 400
          response.end("Pass fixture and url.")
          return
        }
        execFile(
          process.execPath,
          [renderer, fixture, page, props],
          { maxBuffer: 64 * 1024 * 1024 },
          (error, stdout, stderr) => {
            response.statusCode = error ? 500 : 200
            response.setHeader("content-type", "text/html")
            response.end(error ? stderr || error.message : stdout)
          }
        )
      })
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

export default defineConfig(({ isSsrBuild }) => ({
  root: repo,
  plugins: [
    appAtRoot(),
    coreModules(),
    ...(adapter === "octane"
      ? [
          ...(isSsrBuild ? [] : [serverRenderedFixtures()]),
          serverRenderRoute(),
          reactFixturesAsOctane(),
          octane({ requireDirective: true }),
        ]
      : []),
    tailwind(),
  ],
  resolve: {
    alias: [{ find: /^tests\/fixtures\/(.*)$/, replacement: path.join(upstream, "tests/fixtures") + "/$1" }],
    // One copy of each, whichever file asks.
    dedupe: ["react", "react-dom", "octane", "@ui-sdk/core"],
  },
  server: { port: ports[adapter], host: "localhost", strictPort: true },
  preview: { port: ports[adapter], host: "localhost", strictPort: true },
  // The server build bundles everything it renders, so the fixtures, this
  // package and core are compiled for the server by Octane's plugin.
  ssr: { noExternal: true },
  build: {
    outDir: path.join(repo, ".conformance-dist", isSsrBuild ? `${adapter}-server` : adapter),
    emptyOutDir: true,
    rollupOptions: { input: path.join(here, isSsrBuild ? "app/server.tsx" : "app/index.html") },
    target: "esnext",
    minify: false,
  },
}))
