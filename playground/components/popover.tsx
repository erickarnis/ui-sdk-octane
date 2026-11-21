/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createPopoverController,
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../src/components/popover"

const remote = createPopoverController()

export function PopoverPage() {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return (
    <main id="page-popover">
      <section id="basic">
        <Popover>
          <PopoverTrigger id="pop-trigger">Settings</PopoverTrigger>
          <PopoverContent id="pop" side="bottom" align="start" sideOffset={4}>
            <PopoverArrow id="pop-arrow" />
            <PopoverTitle id="pop-title">Dimensions</PopoverTitle>
            <PopoverDescription id="pop-description">Set the size.</PopoverDescription>
            <input id="pop-input" aria-label="Width" defaultValue="100" />
            <button id="pop-apply" type="button">
              Apply
            </button>
            <PopoverClose id="pop-close">Close</PopoverClose>
          </PopoverContent>
        </Popover>
        <button id="pop-after" type="button">
          After
        </button>
      </section>
      <section id="controlled">
        <Popover open={open} onOpenChange={(next) => setOpen(next)}>
          <PopoverTrigger id="cpop-trigger">
            {(state: { open: boolean }) => (state.open ? "Hide" : "Show")}
          </PopoverTrigger>
          <PopoverContent id="cpop" aria-label="Controlled" initialFocus="none">
            <button id="cpop-inside" type="button" onClick={() => setOpen(false)}>
              Close through the app
            </button>
          </PopoverContent>
        </Popover>
        <output id="cpop-open">{String(open)}</output>
        <button id="cpop-outside" type="button" onClick={() => setOpen(true)}>
          Open from outside
        </button>
      </section>
      <section id="detached">
        <PopoverTrigger id="rpop-trigger" controller={remote}>
          Remote
        </PopoverTrigger>
        <Popover controller={remote}>
          <PopoverContent id="rpop" aria-label="Remote">
            <PopoverClose id="rpop-close">Close</PopoverClose>
          </PopoverContent>
        </Popover>
      </section>
      <section id="nested">
        <Popover>
          <PopoverTrigger id="outer-trigger">Outer</PopoverTrigger>
          <PopoverContent id="outer" aria-label="Outer">
            <Popover>
              <PopoverTrigger id="inner-trigger">Inner</PopoverTrigger>
              <PopoverContent id="inner" aria-label="Inner">
                <button id="inner-button" type="button">
                  Deep
                </button>
              </PopoverContent>
            </Popover>
          </PopoverContent>
        </Popover>
      </section>
      <section id="portal">
        <Popover container={target}>
          <PopoverTrigger id="ppop-trigger">Into a container</PopoverTrigger>
          <PopoverContent id="ppop" aria-label="Portaled">
            <Popover>
              <PopoverTrigger id="ppop-inner-trigger">Inner</PopoverTrigger>
              <PopoverContent id="ppop-inner" aria-label="Portaled inner">
                <PopoverClose id="ppop-inner-close">Close</PopoverClose>
              </PopoverContent>
            </Popover>
          </PopoverContent>
        </Popover>
        <div id="portal-root" ref={setTarget} />
      </section>
    </main>
  )
}
