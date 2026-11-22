// A long combobox, after upstream's combobox-perf fixture: typing a
// character that narrows the list.
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ui-sdk/react/combobox"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(1000))
const itemClass = counted("item")

function Fixture() {
  return (
    <Combobox>
      <ComboboxInput aria-label="Search" className="input" />
      <ComboboxContent>
        <ComboboxList>
          {list.map((item) => (
            <ComboboxItem
              key={item.value}
              className={itemClass}
              value={item.value}
              label={item.label}
            >
              {item.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
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

export default defineBench({
  // "Item 1" matches 111 of 1000 items, and "Item 12" 11 of them.
  type: {
    prepare: mount,
    setup: [{ click: ".input" }, { type: "Item 1" }],
    input: { type: "2" },
    reset: unmount,
  },
})
