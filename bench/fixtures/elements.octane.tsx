/** @jsxImportSource octane */
// Octane only: what one element costs made three ways, for the choice the
// adapter's parts make (see "Writing Octane" in AGENTS.md). A part's
// attributes are computed by core at render time, so it can only spread a bag
// of them; this measures that spread as a descriptor (`createElement`) and as
// a compiled template, against a template whose attributes are written out.
import { createElement, createRoot, flushSync, useState, type Root } from "octane"
import { defineBench } from "./harness.ts"

const N = 2000
let bump = () => {}
function Desc({ i, v }: { i: number; v: number }) {
  return createElement("div", { "data-i": i, "data-v": v, className: "x", children: "item" })
}
function Spread({ i, v }: { i: number; v: number }) {
  const props = { "data-i": i, "data-v": v, className: "x", children: "item" }
  return <div {...props} />
}
function Static({ i, v }: { i: number; v: number }) {
  return <div data-i={i} data-v={v} className="x">item</div>
}
function App({ kind }: { kind: "desc" | "spread" | "static" }) {
  const [v, setV] = useState(0)
  bump = () => setV((x) => x + 1)
  const C = kind === "desc" ? Desc : kind === "spread" ? Spread : Static
  return <div>{Array.from({ length: N }, (_, i) => <C key={i} i={i} v={v} />)}</div>
}
const host = document.getElementById("root")!
let root: Root | undefined
const mount = (kind: "desc" | "spread" | "static") => () => {
  root = createRoot(host)
  flushSync(() => root?.render(<App kind={kind} />))
}
const unmount = () => { root?.unmount(); root = undefined }
export default defineBench({
  "desc mount": { act: mount("desc"), reset: unmount },
  "spread mount": { act: mount("spread"), reset: unmount },
  "static mount": { act: mount("static"), reset: unmount },
  "static update": { prepare: mount("static"), act: () => flushSync(bump), reset: unmount },
  "desc update": { prepare: mount("desc"), act: () => flushSync(bump), reset: unmount },
  "spread update": { prepare: mount("spread"), act: () => flushSync(bump), reset: unmount },
})
