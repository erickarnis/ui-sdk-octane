// A long select, after upstream's select-perf fixture: opening and closing a
// popup with many items.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"
import { useState } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(500))
const itemClass = counted("item")

let setOpen: (open: boolean) => void = () => {}

function Fixture() {
  const [open, change] = useState(false)
  setOpen = change
  return (
    <Select defaultValue={list[0]?.value} open={open} onOpenChange={change}>
      <SelectTrigger aria-label="Pick" className="trigger">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {list.map((item) => (
          <SelectItem
            key={item.value}
            className={itemClass}
            value={item.value}
            label={item.label}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  open: { prepare: mount, input: { click: ".trigger" }, reset: unmount },
  close: {
    prepare() {
      mount()
      flushSync(() => setOpen(true))
    },
    input: { press: "Escape" },
    reset: unmount,
  },
})
