// @ts-check
// A Vite plugin that hands this package's own source to the consumer's Octane
// compiler. Octane's Vite plugin does that by itself for any installed package
// whose manifest declares `octane`, so a plain Vite project does not need this.
// It is for hosts that keep `node_modules` away from that plugin: @octanejs/astro
// lets only `@octanejs/*` and `octane` through (its should-skip-transform.js),
// which leaves this package's hooks without the slots Octane's runtime needs.
//
// It compiles with `octane/compiler/bundler`, the compiler every Octane bundler
// adapter drives, from the consumer's own Octane, so the slots match the runtime
// the app loads. Nothing here is specific to one Octane version.
import { realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createOctaneCompiler } from "octane/compiler/bundler"

const PACKAGE = "ui-sdk-octane"

/** Vite's module ids use forward slashes on every platform. */
const slashed = (/** @type {string} */ file) => file.split(path.sep).join("/")

/** The path a module id names, without the query Vite may add. */
const fileOf = (/** @type {string} */ id) => id.split("?", 1)[0] ?? id

// Node resolved this module through any symlink, so this is the real path, as
// Vite's ids are unless `resolve.preserveSymlinks` is on.
const sourceDir =
  slashed(realpathSync(fileURLToPath(new URL("../src", import.meta.url)))) + "/"

/**
 * Whether a module is this package's source. With `resolve.preserveSymlinks`
 * the id is the path under the app's `node_modules`, which only the file
 * system can match to the real one.
 * @param {string} file
 */
function isOwnSource(file) {
  if (file.startsWith(sourceDir)) return true
  if (!file.includes(`/${PACKAGE}/src/`)) return false
  try {
    return (slashed(realpathSync(file)) + "/").startsWith(sourceDir)
  } catch {
    return false
  }
}

// The name Octane's compiler gives the slot range it adds to a module. Seeing
// it means Octane's own plugin ran first, as it does in a plain Vite project
// that also lists this plugin.
const SLOTTED = /\b_\$hookSlots\b/
// The comment Octane's compiler reads as "leave this module's hooks alone", so
// its plugin does not slot again when it runs after this one.
const NO_SLOT = "\n// octane-no-slot\n"

/**
 * Compiles this package's hooks with the app's Octane compiler.
 *
 * Add it to Vite's plugins wherever Octane's own plugin is kept away from
 * `node_modules`. Under Astro:
 *
 * ```js
 * export default defineConfig({
 *   integrations: [octane()],
 *   vite: { plugins: [uiSdkOctane()] },
 * })
 * ```
 *
 * @returns {import("vite").Plugin}
 */
export function uiSdkOctane() {
  /** @type {import("octane/compiler/bundler").OctaneCompiler | undefined} */
  let compiler
  let serving = false
  return {
    name: PACKAGE,
    enforce: "pre",
    config() {
      // What Octane's plugin sets for the source packages it finds in the
      // app's manifest, repeated so the package also works where it is not a
      // direct dependency. The source must reach this plugin, never a
      // prebundle or Node's own loader, and core must load once: prebundled
      // for the app and raw for this package would be two copies with two
      // sets of state.
      return {
        optimizeDeps: { exclude: [PACKAGE, "@ui-sdk/core"] },
        ssr: { noExternal: [PACKAGE] },
        resolve: { dedupe: ["octane"] },
      }
    },
    configResolved(config) {
      compiler = createOctaneCompiler({ root: config.root })
      serving = config.command === "serve"
    },
    transform(code, id, options) {
      if (compiler === undefined || !isOwnSource(fileOf(id))) return null
      if (SLOTTED.test(code)) return null
      const server = options?.ssr === true
      // The options Octane's Vite plugin passes for the same module.
      const result = compiler.transform(code, id, {
        environment: server ? "server" : "client",
        explicitRuntimeRequests: server,
        hmr: !server && serving ? "vite" : false,
        dev: serving,
      })
      if (result === null || result.kind === "none") return null
      return {
        code: result.kind === "slots" ? result.code + NO_SLOT : result.code,
        map: result.map,
      }
    },
  }
}
