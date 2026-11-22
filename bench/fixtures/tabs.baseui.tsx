/** @jsxImportSource octane */
// The tabs fixture on Octane's own port of Base UI, as a reference for what
// well-written Octane costs. Base UI keeps every panel mounted and hides the
// unselected ones, where UI SDK renders only the selected panel, so the two
// mount different amounts of DOM: compare it with care.
import { Tabs } from "@octanejs/base-ui/tabs"
import { createRoot, flushSync, type Root } from "octane"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(1000))
const target = list[Math.floor(list.length / 2)]?.value

const tabClass = counted("tab")
const panelClass = counted("panel")

function Fixture() {
  return (
    <Tabs.Root defaultValue={list[0]?.value}>
      <Tabs.List aria-label="Pages">
        {list.map((item) => (
          <Tabs.Tab
            key={item.value}
            className={tabClass}
            value={item.value}
            data-target={item.value === target ? "" : undefined}
          >
            {item.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {list.map((item) => (
        <Tabs.Panel key={item.value} className={panelClass} value={item.value}>
          {item.label} content.
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}

const host = document.getElementById("root")!
let root: Root | undefined

const mount = () => {
  root = createRoot(host)
  flushSync(() => root?.render(<Fixture />))
}
const unmount = () => {
  root?.unmount()
  root = undefined
}

export default defineBench({
  mount: { act: mount, reset: unmount },
  "select one": { prepare: mount, input: { click: "[data-target]" }, reset: unmount },
  unmount: { prepare: mount, act: unmount },
})
