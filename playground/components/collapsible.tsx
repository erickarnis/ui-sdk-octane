/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../../src/components/collapsible"

export function CollapsiblePage() {
  const [open, setOpen] = useState(false)
  return (
    <main id="page-collapsible">
      <section id="uncontrolled">
        <Collapsible id="col">
          <CollapsibleTrigger id="col-trigger">Details</CollapsibleTrigger>
          <CollapsiblePanel id="col-panel">Hidden text</CollapsiblePanel>
        </Collapsible>
      </section>
      <section id="controlled">
        <Collapsible open={open} onOpenChange={(next) => setOpen(next)}>
          <CollapsibleTrigger id="ccol-trigger">
            {(state: { open: boolean }) => (state.open ? "Hide" : "Show")}
          </CollapsibleTrigger>
          <CollapsiblePanel id="ccol-panel" keepMounted>
            Kept text
          </CollapsiblePanel>
        </Collapsible>
        <output id="ccol-open">{String(open)}</output>
        <button id="ccol-outside" type="button" onClick={() => setOpen(!open)}>
          Flip
        </button>
      </section>
      <section id="disabled">
        <Collapsible disabled>
          <CollapsibleTrigger id="dcol-trigger">Disabled</CollapsibleTrigger>
          <CollapsiblePanel id="dcol-panel">Never</CollapsiblePanel>
        </Collapsible>
      </section>
    </main>
  )
}
