/** @jsxImportSource octane */
/// <reference types="vite/client" />
// Mounts a fixture page into every `[data-root]`, as the query asks:
// `render=client` with createRoot, `render=ssr` with hydrateRoot over the
// server's HTML. With `hold`, nothing mounts until the driver calls
// `modes.start()`, so it can read the server's HTML first. Each root has the
// identifier prefix the server gave it, as an Astro island does, and the page
// gets the `delay` the server's render got.
import { createRoot, hydrateRoot, type Root } from "octane"
import { createAgent } from "@ui-sdk/core/agent"
import { probeLog } from "./parts"

const pages = import.meta.glob<{ Page: (props: object) => unknown }>(
  "./pages/*.tsx"
)
const query = new URLSearchParams(location.search)
const name = location.pathname.split("/").pop() ?? ""

const props = query.has("delay") ? { delay: Number(query.get("delay")) } : {}
const recoverable: string[] = []
const roots: Root[] = []

async function start() {
  const load = pages[`./pages/${name}.tsx`]
  if (!load) throw new Error(`No fixture page named ${name}.`)
  const { Page } = await load()
  for (const container of document.querySelectorAll<HTMLElement>("[data-root]")) {
    const identifierPrefix = container.dataset.root ?? ""
    const onRecoverableError = (error: unknown) => {
      recoverable.push(String(error))
    }
    if (query.get("render") === "ssr" || query.get("render") === "stream") {
      roots.push(
        hydrateRoot(container, Page, props, { identifierPrefix, onRecoverableError })
      )
    } else {
      const root = createRoot(container, { identifierPrefix, onRecoverableError })
      root.render(Page, props)
      roots.push(root)
    }
  }
  // For the driver: every root has rendered once.
  document.documentElement.dataset.mounted = ""
}

const modes = { start, roots, recoverable, probeLog, agent: createAgent() }
declare global {
  interface Window {
    modes: typeof modes
  }
}
window.modes = modes
if (!query.has("hold")) void start()
