/** @jsxImportSource octane */
// How a part holds its element: through a ref the app replaces on every
// render, through a change of the part's own key, and when it is removed.
import { useLayoutEffect, useState } from "octane"
import { Probe, ProbeItem, probeLog } from "../parts"

export function Page() {
  const [count, setCount] = useState(0)
  const [value, setValue] = useState("a")
  const [shown, setShown] = useState(true)
  const [atCommit, setAtCommit] = useState("")
  // What the removed part had let go of by the end of the commit that
  // removed it, before any microtask.
  useLayoutEffect(() => {
    if (!shown) setAtCommit(probeLog.items.join(" "))
  }, [shown])
  return (
    <main>
      <button id="again" type="button" onClick={() => setCount(count + 1)}>Render again {count}</button>
      <button id="rekey" type="button" onClick={() => setValue(value === "a" ? "b" : "a")}>Change the item's value</button>
      <button id="remove" type="button" onClick={() => setShown(false)}>Remove the item</button>
      <output id="at-commit">{atCommit}</output>
      <Probe
        id="inline"
        ref={(el: HTMLElement | null) => {
          document.body.dataset.inline = el ? "attached" : "detached"
        }}
      >
        Inline ref {count}
        {shown && <ProbeItem id="item" value={value}>item {value}</ProbeItem>}
      </Probe>
    </main>
  )
}
