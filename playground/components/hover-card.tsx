/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createHoverCardController,
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "../../src/components/hover-card"

const remote = createHoverCardController()

export function HoverCardPage() {
  const [open, setOpen] = useState(false)
  return (
    <main id="page-hover-card">
      <p>
        <button id="hc-before" type="button">
          Before
        </button>
      </p>
      <p>
        <HoverCard delay={200} closeDelay={200}>
          <HoverCardTrigger id="hc-trigger" href="#profile">
            @octane
          </HoverCardTrigger>
          <HoverCardContent id="hc" side="bottom" sideOffset={6}>
            <HoverCardArrow id="hc-arrow" />
            <a id="hc-link" href="#more">
              More
            </a>
          </HoverCardContent>
        </HoverCard>
      </p>
      <p style="margin-top:200px">
        <HoverCard open={open} onOpenChange={(next) => setOpen(next)} delay={0}>
          <HoverCardTrigger id="chc-trigger" href="#c">
            controlled
          </HoverCardTrigger>
          <HoverCardContent id="chc">Controlled card</HoverCardContent>
        </HoverCard>
        <output id="chc-open">{String(open)}</output>
        <button id="chc-outside" type="button" onClick={() => setOpen(true)}>
          Open from outside
        </button>
      </p>
      <p style="margin-top:100px">
        <HoverCardTrigger id="rhc-trigger" href="#r" controller={remote}>
          remote
        </HoverCardTrigger>
        <HoverCard controller={remote} delay={0}>
          <HoverCardContent id="rhc">Remote card</HoverCardContent>
        </HoverCard>
      </p>
    </main>
  )
}
