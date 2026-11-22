// Many tabs and panels, after upstream's tabs-perf fixture: mounting many
// parts, an update that changes a few of them, and unmounting.
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(1000))
const target = list[Math.floor(list.length / 2)]?.value

const tabClass = counted("tab")
const panelClass = counted("panel")

function Fixture() {
  return (
    <Tabs defaultValue={list[0]?.value}>
      <TabsList aria-label="Pages">
        {list.map((item) => (
          <TabsTab
            key={item.value}
            className={tabClass}
            value={item.value}
            data-target={item.value === target ? "" : undefined}
          >
            {item.label}
          </TabsTab>
        ))}
      </TabsList>
      {list.map((item) => (
        <TabsPanel key={item.value} className={panelClass} value={item.value}>
          {item.label} content.
        </TabsPanel>
      ))}
    </Tabs>
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

defineBench({
  mount: { act: mount, reset: unmount },
  "select one": { prepare: mount, input: { click: "[data-target]" }, reset: unmount },
  unmount: { prepare: mount, act: unmount },
})
