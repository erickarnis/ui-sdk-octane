/** @jsxImportSource octane */
// Octane only, a probe rather than a benchmark: whether an attribute bound to
// a signal updates without rendering its component again, when the element
// is written out in a template, when its props are spread in one, and when
// it is made with createElement, which is how a part renders.
import { createElement, createRoot, flushSync, useEffect } from "octane"
import { useSignal$ } from "octane/signals/client"
import { defineBench } from "./harness.ts"

type Signal = ReturnType<typeof useSignal$<string>>
const signals: Signal[] = []
const renders = { written: 0, spread: 0, described: 0 }

function Written() @{
  const value$ = useSignal$("a")
  signals[0] = value$
  // Counted after each render, so the render itself stays pure.
  useEffect(() => {
    renders.written++
  }, null)
  <div id="written" data-value={value$} />
}
function Spread() @{
  const value$ = useSignal$("a")
  signals[1] = value$
  // Counted after each render, so the render itself stays pure.
  useEffect(() => {
    renders.spread++
  }, null)
  const props = { id: "spread", "data-value": value$ }
  <div {...props} />
}
function Described() {
  const value$ = useSignal$("a")
  signals[2] = value$
  // Counted after each render, so the render itself stays pure.
  useEffect(() => {
    renders.described++
  }, null)
  return createElement("div", { id: "described", "data-value": value$ })
}

createRoot(document.getElementById("root")!).render(
  <>
    <Written />
    <Spread />
    <Described />
  </>
)

export default defineBench({
  probe: {
    act() {
      flushSync(() => {
        for (const signal of signals) signal.set("b")
      })
      const read = (id: string) => document.getElementById(id)?.getAttribute("data-value")
      console.log(
        "probe:",
        JSON.stringify({
          renders,
          values: { written: read("written"), spread: read("spread"), described: read("described") },
        })
      )
    },
  },
})
