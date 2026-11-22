// Many switches that one value controls, so one update changes every part.
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { useState } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { counted, defineBench, items, size } from "./harness.ts"

const list = items(size(500))
const switchClass = counted("switch")
const thumbClass = counted("thumb")

let toggle: () => void = () => {}

function Fixture() {
  const [checked, setChecked] = useState(false)
  toggle = () => setChecked((value) => !value)
  return (
    <div>
      {list.map((item) => (
        <Switch
          key={item.value}
          aria-label={item.label}
          className={switchClass}
          checked={checked}
          name={item.value}
        >
          <SwitchThumb className={thumbClass} />
        </Switch>
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
  "toggle all": { prepare: mount, act: () => flushSync(toggle), reset: unmount },
})
