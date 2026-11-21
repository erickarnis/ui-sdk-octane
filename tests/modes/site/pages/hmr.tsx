/** @jsxImportSource octane */
// A page hmr.mjs edits while it is open, and whose parts come from a module
// it edits too.
import { useState } from "octane"
import { usePart, usePrimitive, type PartProps } from "../../../../src/primitive"
import { Widget, widget } from "../hmr-widget"

function HandWidget(props: PartProps<"button">) {
  const handle = usePrimitive(widget, {})
  return usePart(handle, "root", {}, props, "button")
}

// The page holds an instance of its own too: Octane keeps an edited
// component's state through a hot update, and the instance is state.
export function Page() {
  const [count, setCount] = useState(0)
  const own = usePrimitive(widget, {})
  const ownButton = usePart(own, "root", {}, { id: "own", children: "Own" }, "button")
  return (
    <main>
      <p id="edition">page edition 0</p>
      <button id="count" type="button" onClick={() => setCount(count + 1)}>{count}</button>
      <Widget id="widget">Widget</Widget>
      <HandWidget id="hand">Hand</HandWidget>
      {ownButton}
    </main>
  )
}
