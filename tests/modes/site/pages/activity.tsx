/** @jsxImportSource octane */
// Parts inside <Activity>: hidden and shown again, hidden from the first
// render, removed while hidden, and hidden while their elements leave the page.
import { Activity, flushSync, useState } from "octane"
import { Probe, Tabs } from "../parts"

export function Page() {
  const [mode, setMode] = useState<"visible" | "hidden">("visible")
  const [late, setLate] = useState<"visible" | "hidden">("hidden")
  const [mounted, setMounted] = useState(true)
  const [on, setOn] = useState(false)
  return (
    <main>
      <button id="toggle" type="button" onClick={() => setMode(mode === "visible" ? "hidden" : "visible")}>
        {mode}
      </button>
      <button
        id="blink"
        type="button"
        onClick={() => {
          // Hidden and shown again in one task.
          flushSync(() => setMode("hidden"))
          flushSync(() => setMode("visible"))
        }}
      >
        Blink
      </button>
      <button id="toggle-late" type="button" onClick={() => setLate(late === "visible" ? "hidden" : "visible")}>
        late {late}
      </button>
      <button id="unmount" type="button" onClick={() => setMounted(false)}>Unmount</button>
      <button id="outside" type="button" onClick={() => setOn(!on)}>Flip held from outside</button>
      {mounted && (
        <div id="shell">
          <Activity mode={mode}>
            <section id="inside">
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
            </section>
          </Activity>
        </div>
      )}
      <Activity mode={late}>
        <Probe id="late" defaultOn>Late</Probe>
      </Activity>
    </main>
  )
}
