/** @jsxImportSource octane */
/// <reference types="vite/client" />
// The one page every test opens: `/?fixture=<name>` mounts
// `tests/fixtures/<name>.tsx`. The Octane lane compiles this file and the
// fixtures as they are. The React lane compiles the same files with `octane`
// and the adapter swapped for React and @ui-sdk/react (see ../vite.ts), so
// both lanes render the same components from the same source.
import { createRoot } from "octane"
import { adapter } from "./harness"

const fixtures = import.meta.glob<{ default: () => unknown }>(
  "../fixtures/*.tsx"
)
const name = new URLSearchParams(location.search).get("fixture") ?? ""
const load = fixtures[`../fixtures/${name}.tsx`]
const container = document.getElementById("app")

if (!load || !container) {
  document.body.textContent = `No fixture named "${name}". Fixtures: ${Object.keys(
    fixtures
  )
    .map((path) => path.replace(/^.*\/|\.tsx$/g, ""))
    .join(", ")}`
} else {
  const { default: Fixture } = await load()
  createRoot(container).render(<Fixture />)
  // Tests wait for this before they look at the page.
  document.documentElement.dataset.adapter = adapter
}
