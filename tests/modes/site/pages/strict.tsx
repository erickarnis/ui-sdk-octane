/** @jsxImportSource octane */
// Parts under StrictMode, and a component that counts its own renders and
// effects, which shows whether Octane's StrictMode replays either.
import { StrictMode, useEffect, useLayoutEffect, useState } from "octane"
import { Probe, Tabs } from "../parts"

const counts = { renders: 0, effects: 0, cleanups: 0, layouts: 0, initializers: 0 }

function Counter() {
  counts.renders++
  useState(() => counts.initializers++)
  useLayoutEffect(() => {
    counts.layouts++
  }, [])
  useEffect(() => {
    counts.effects++
    return () => {
      counts.cleanups++
    }
  }, [])
  return <output id="counts" data-counts={JSON.stringify(counts)} />
}

export function Page() {
  const [on, setOn] = useState(false)
  const [, rerender] = useState(0)
  return (
    <StrictMode>
      <Counter />
      <button id="read" type="button" onClick={() => rerender((n) => n + 1)}>Read counts</button>
      <Probe id="free">Free</Probe>
      <Probe id="held" on={on} onOnChange={setOn}>{on ? "On" : "Off"}</Probe>
      <Tabs.Root defaultValue="a" id="tabs">
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
      </Tabs.Root>
    </StrictMode>
  )
}
