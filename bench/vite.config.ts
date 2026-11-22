// Builds the bench page (./app) for one adapter, as a production build:
//
//   BENCH_ADAPTER=octane  this package, with the fixtures compiled as Octane
//                         modules, and the Base UI fixtures on @octanejs/base-ui
//   BENCH_ADAPTER=react   @ui-sdk/react as published
//
// The fixtures are written for React, as upstream's are, and respelled for
// Octane the way ../conformance/vite.config.ts respells upstream's.
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { octane } from "octane/compiler/vite"
import { defineConfig, type Plugin } from "vite"

const adapter = process.env.BENCH_ADAPTER === "react" ? "react" : "octane"
const here = fileURLToPath(new URL(".", import.meta.url))
const repo = path.dirname(here.replace(/\/$/, ""))
const fixtures = path.join(here, "fixtures") + "/"
const source = path.join(repo, "src")

// A component's file, in whichever format it has been written so far.
const component = (name: string) =>
  [".tsx", ".ts"]
    .map((extension) => path.join(source, "components", name + extension))
    .find((file) => existsSync(file))

function reactFixturesAsOctane(): Plugin {
  return {
    name: "bench:react-fixtures-as-octane",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?", 1)[0] ?? id
      if (!file.startsWith(fixtures) || !/\.tsx$/.test(file) || /\.(baseui|octane)\.tsx$/.test(file))
        return null
      const respelled = code
        .replace(/from "react-dom\/client"/g, 'from "octane"')
        .replace(/from "react-dom"/g, 'from "octane"')
        .replace(/from "react"/g, 'from "octane"')
        .replace(/from "@ui-sdk\/react\/([a-z-]+)"/g, (_, name: string) => {
          const found = component(name)
          if (!found) throw new Error(`No component file for @ui-sdk/react/${name}.`)
          return `from "${found}"`
        })
      return { code: `/** @jsxImportSource octane */\n${respelled}`, map: null }
    },
  }
}

// The Base UI and Octane-only fixtures are Octane modules, which the React
// build leaves empty.
function withoutOctaneFixtures(): Plugin {
  return {
    name: "bench:without-octane-fixtures",
    enforce: "pre",
    load: (id) => (/\.(baseui|octane)\.(tsx|tsrx)$/.test(id.split("?", 1)[0] ?? "") ? "export {}" : null),
  }
}

export default defineConfig({
  // Octane's compiler takes a file as the project's own only under Vite's root.
  root: repo,
  plugins:
    adapter === "octane"
      ? [reactFixturesAsOctane(), octane({ requireDirective: true })]
      : [withoutOctaneFixtures()],
  // The fixtures' JSX is React's in the React build; the repository's
  // tsconfig names Octane's.
  ...(adapter === "react" ? { oxc: { jsx: { importSource: "react" } } } : {}),
  resolve: { dedupe: ["react", "react-dom", "octane", "@ui-sdk/core"] },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  logLevel: "error",
  build: {
    outDir: path.join(repo, ".bench-dist", adapter),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(here, "app/index.html"),
      // A profile build keeps one file per module, so a profile says whose
      // code each function is: core's, Octane's or this adapter's.
      ...(process.env.BENCH_MINIFY === "false" ? { output: { preserveModules: true } } : {}),
    },
    target: "esnext",
    // `pnpm bench --profile` builds without minifying, so a profile names functions.
    minify: process.env.BENCH_MINIFY !== "false",
  },
})
