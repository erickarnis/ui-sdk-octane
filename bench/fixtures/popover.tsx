// Many popovers on one page, after upstream's popover-perf fixture: one
// instance per row, and opening one of them.
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@ui-sdk/react/popover"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(200))
const triggerClass = counted("trigger")

function Fixture() {
  return (
    <div>
      {list.map((item, index) => (
        <Popover key={item.value}>
          <PopoverTrigger className={triggerClass} data-target={index === 0 ? "" : undefined}>
            {item.label}
          </PopoverTrigger>
          <PopoverContent aria-label={item.label}>
            {item.label} details.
            <PopoverClose>Close</PopoverClose>
          </PopoverContent>
        </Popover>
      ))}
    </div>
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
  open: { prepare: mount, input: { click: "[data-target]" }, reset: unmount },
  close: {
    prepare: mount,
    setup: [{ click: "[data-target]" }],
    input: { press: "Escape" },
    reset: unmount,
  },
})
