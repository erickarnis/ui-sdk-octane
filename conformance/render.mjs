// Renders one fixture on the server and writes its HTML to stdout:
//
//   node conformance/render.mjs <fixture> <page url> [<props as JSON>]
//
// The preview server's `/__ssr` route runs it once per request. A process per
// render because fixtures read their options from `location`, some of them
// while their module evaluates, so each render needs the page's URL in place
// before the fixture's modules load, and modules loaded fresh.
import path from "node:path"
import { pathToFileURL } from "node:url"

const [fixture, url, props = "{}"] = process.argv.slice(2)
if (!fixture || !url) {
  console.error("Usage: node conformance/render.mjs <fixture> <page url>")
  process.exit(2)
}
globalThis.location = new URL(url)
const entry = path.join(import.meta.dirname, "../.conformance-dist/octane-server/server.js")
const { loadFixture, renderFixture } = await import(pathToFileURL(entry).href)
// Four fixtures (dialog, drawer, menu, menubar) hand the specs a controller or
// a counter by writing it to `window` while their module evaluates, which
// react-ssr's in-browser render allows. Those writes are for the page, not
// the render, so they land in an object that is gone again before the render,
// where `window` is undefined as on any server.
globalThis.window = {}
const Fixture = await loadFixture(fixture)
delete globalThis.window
process.stdout.write(renderFixture(Fixture, JSON.parse(props)))
