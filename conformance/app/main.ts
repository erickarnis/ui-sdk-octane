/// <reference types="vite/client" />
// The page upstream's specs open, as UI SDK's own playground serves it:
// `/?fixture=menu&framework=react` mounts `fixtures/menu/react.tsx` from
// upstream's playground. The specs only ever ask for React's fixtures here.
// Which adapter renders them is decided by the build (see ../vite.config.ts):
// @ui-sdk/react as published, or this package with the same files compiled
// for Octane. It follows upstream's `apps/playground/src/main.ts`.
import coreModules from "virtual:core-modules"
import { applyFixtureOptions, loadScreenReader } from "tests/fixtures/page.ts"

const fixtures = import.meta.glob<{
  mount: (root: HTMLElement) => void | Promise<void>
}>("../../.upstream/apps/playground/src/fixtures/*/react*.tsx")

// Specs that check core's modules load them through the page, as the
// instances the fixture uses. A module is named by its file, like "modal".
Object.assign(window, {
  loadCoreModule: (name: string) => coreModules[name]?.(),
  loadTesting: () => import("@ui-sdk/core/testing"),
})

const params = applyFixtureOptions()
// A page that presents popups as sheets loads the sheet code first, unless
// ?lazy leaves that to the popups.
if (params.has("presentation") && !params.has("lazy"))
  await coreModules["sheet-presentation"]?.()
// ?agent puts an agent bridge on the page before any component is made.
if (params.has("agent"))
  Object.assign(window, {
    __agent: (await import("@ui-sdk/core/agent")).createAgent(),
  })

const fixture = params.get("fixture")
const framework = params.get("framework") ?? "react"
const load =
  fixture &&
  Object.entries(fixtures).find(([file]) =>
    file.endsWith(`/fixtures/${fixture}/${framework}.tsx`)
  )?.[1]
const root = document.getElementById("root")

if (!load || !root) {
  // Specs skip themselves where a fixture is missing.
  document.body.dataset.missingFixture = ""
  document.body.textContent = `No fixture for ${fixture} in ${framework}.`
} else {
  const module = await load()
  await module.mount(root)
  // Specs wait for this, since a mount can wait on a component it imports late.
  document.body.dataset.mounted = ""
  await loadScreenReader()
}
