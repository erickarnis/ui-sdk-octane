/** @jsxImportSource octane */
// Tabs whose value the app holds, and a list of tabs the app changes.
import { useState } from "octane"
import { tabs } from "@ui-sdk/core/tabs"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"

const Tabs = createParts(tabs, { root: "div", list: "div", tab: "button", panel: "div" })

export default function Fixture() {
  const [value, setValue] = useState("one")
  const [locked, setLocked] = useState(false)
  const [names, setNames] = useState(["one", "two", "three"])
  return (
    <main>
      <Tabs.Root
        id="controlled"
        value={value}
        onValueChange={(next, details) => {
          called("onValueChange", next, details.reason)
          if (!locked && next !== null) setValue(next)
        }}
      >
        <Tabs.List aria-label="Numbers">
          {names.map((name) => (
            <Tabs.Tab key={name} value={name}>
              Tab {name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {names.map((name) => (
          <Tabs.Panel key={name} value={name}>
            Panel {name}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
      <output id="value">{value}</output>

      <section aria-label="the app">
        <button id="lock" type="button" onClick={() => setLocked(!locked)}>
          {locked ? "Unlock" : "Lock"}
        </button>
        <button id="select-three" type="button" onClick={() => setValue("three")}>
          Select three from outside
        </button>
        <button id="add" type="button" onClick={() => setNames([...names, `extra${names.length}`])}>
          Add a tab
        </button>
        <button id="remove-first" type="button" onClick={() => setNames(names.slice(1))}>
          Remove the first tab
        </button>
        <button id="reverse" type="button" onClick={() => setNames([...names].reverse())}>
          Reverse the tabs
        </button>
      </section>
    </main>
  )
}
