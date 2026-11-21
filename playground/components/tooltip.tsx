/** @jsxImportSource octane */
import {
  createTooltipController,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipShortcut,
  TooltipTrigger,
} from "../../src/components/tooltip"

const remote = createTooltipController()

export function TooltipPage() {
  return (
    <main id="page-tooltip">
      <section id="basic" style={{ padding: "60px" }}>
        <button id="tip-before" type="button">
          Before
        </button>
        <Tooltip delay={100} shortcut="Mod+S">
          <TooltipTrigger id="tip-trigger" aria-label="Save">
            S
          </TooltipTrigger>
          <TooltipContent id="tip" side="top" sideOffset={4}>
            Save <TooltipShortcut id="tip-shortcut" />
            <TooltipArrow id="tip-arrow" />
          </TooltipContent>
        </Tooltip>
        <Tooltip delay={100}>
          <TooltipTrigger id="tip2-trigger">Open file</TooltipTrigger>
          <TooltipContent id="tip2" side="bottom">
            Opens the file picker
          </TooltipContent>
        </Tooltip>
        <button id="tip-after" type="button">
          After
        </button>
      </section>
      <section id="detached">
        <TooltipTrigger id="rtip-trigger" controller={remote}>
          Remote
        </TooltipTrigger>
        <button id="rtip-api" type="button" onClick={() => remote.open()}>
          Open by controller
        </button>
        <Tooltip controller={remote}>
          <TooltipContent id="rtip">Remote tip</TooltipContent>
        </Tooltip>
      </section>
      <section id="disabled">
        <Tooltip disabled>
          <TooltipTrigger id="dtip-trigger">Never</TooltipTrigger>
          <TooltipContent id="dtip">Hidden</TooltipContent>
        </Tooltip>
      </section>
    </main>
  )
}
