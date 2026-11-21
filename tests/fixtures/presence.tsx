/** @jsxImportSource octane */
// Parts that come and go: a panel that is only in the page while open, with
// an id its trigger points at.
import { useState } from "octane"
import { collapsible } from "@ui-sdk/core/collapsible"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"
import { disclosure } from "./primitives"

// No `root` tag: Root renders no element of its own, only shares the instance.
const Disclosure = createParts(disclosure, { trigger: "button", panel: "div" })
const Collapsible = createParts(collapsible, { root: "div", trigger: "button", panel: "div" })

export default function Fixture() {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  return (
    <main>
      <section id="plain">
        <Disclosure.Root>
          <Disclosure.Trigger>
            {(state: { open: boolean }) => (state.open ? "Hide details" : "Show details")}
          </Disclosure.Trigger>
          <Disclosure.Panel>Details</Disclosure.Panel>
        </Disclosure.Root>
      </section>

      <section id="starts-open">
        <Disclosure.Root defaultOpen>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Panel>Open from the start</Disclosure.Panel>
        </Disclosure.Root>
      </section>

      <section id="own-id">
        <Disclosure.Root>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Panel id="authors-panel">The app named this panel</Disclosure.Panel>
        </Disclosure.Root>
      </section>

      <section id="controlled">
        <Disclosure.Root
          open={open}
          onOpenChange={(next, details) => {
            called("onOpenChange", next, details.reason)
            if (!locked) setOpen(next)
          }}
        >
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Panel>Controlled panel</Disclosure.Panel>
        </Disclosure.Root>
        <button id="lock" type="button" onClick={() => setLocked(!locked)}>
          {locked ? "Unlock" : "Lock"}
        </button>
        <button id="open-outside" type="button" onClick={() => setOpen(!open)}>
          Toggle from outside
        </button>
      </section>

      <section id="collapsible">
        <Collapsible.Root
          onOpenChange={(next, details) => called("collapsible onOpenChange", next, details.reason)}
        >
          <Collapsible.Trigger>Shipping</Collapsible.Trigger>
          <Collapsible.Panel>Ships in two days.</Collapsible.Panel>
        </Collapsible.Root>
      </section>

      <section id="kept">
        <Collapsible.Root>
          <Collapsible.Trigger>Returns</Collapsible.Trigger>
          <Collapsible.Panel keepMounted>Thirty days.</Collapsible.Panel>
        </Collapsible.Root>
      </section>

      <section id="disabled">
        <Collapsible.Root disabled defaultOpen>
          <Collapsible.Trigger>Warranty</Collapsible.Trigger>
          <Collapsible.Panel>One year.</Collapsible.Panel>
        </Collapsible.Root>
      </section>
    </main>
  )
}
