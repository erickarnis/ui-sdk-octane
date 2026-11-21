/** @jsxImportSource octane */
// Core's tabs through `createParts`: two instances on one page, state
// functions for class, style and children, and a `render` element.
import { tabs } from "@ui-sdk/core/tabs"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"

const Tabs = createParts(tabs, { root: "div", list: "div", tab: "button", panel: "div" })

export default function Fixture() {
  return (
    <main>
      <Tabs.Root
        defaultValue="a"
        id="basic"
        onValueChange={(value, details) => called("basic onValueChange", value, details.reason)}
      >
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab
            value="b"
            className={(state) => (state.selected ? "on" : "off")}
            style={(state) => ({ fontWeight: state.selected ? 700 : 400 })}
          >
            {(state: { selected: boolean }) => (state.selected ? "Beta (open)" : "Beta")}
          </Tabs.Tab>
          <Tabs.Tab value="c" render={<a href="#c" data-custom="yes" />}>
            Gamma
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
        <Tabs.Panel value="c">Panel C</Tabs.Panel>
      </Tabs.Root>

      <Tabs.Root defaultValue="x" id="manual" orientation="vertical" activation="manual" loop={false}>
        <Tabs.List aria-label="Settings">
          <Tabs.Tab value="x">Account</Tabs.Tab>
          <Tabs.Tab value="y" disabled>
            Billing
          </Tabs.Tab>
          <Tabs.Tab value="z">Team</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="x">Account settings</Tabs.Panel>
        <Tabs.Panel value="y">Billing settings</Tabs.Panel>
        <Tabs.Panel value="z" keepMounted>
          Team settings
        </Tabs.Panel>
      </Tabs.Root>
    </main>
  )
}
