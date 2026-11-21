/** @jsxImportSource octane */
// What a consumer writes: its own primitive, core's tabs, and the adapter
// imported by package name. Kept the same in consumer-vite and consumer-astro
// so one browser script checks both.
import { useState } from "octane"
import { createChange, definePrimitive } from "@ui-sdk/core"
import { tabs } from "@ui-sdk/core/tabs"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "ui-sdk-octane/primitive"
// A ready-made component, by its own entry.
import { Switch, SwitchThumb } from "ui-sdk-octane/switch"
// One that reads its children: a closed select learns its value's label from
// the items written inside it, which needs the bundler to hand it elements.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui-sdk-octane/select"

type MuteOptions = {
  muted?: boolean
  onMutedChange?: (muted: boolean) => void
}

const muteButton = definePrimitive({
  name: "mute-button",
  options: { muted: "boolean", onMutedChange: "callback" },
  controlled: ["muted"],
  state: (options: MuteOptions) => ({ muted: options.muted ?? false }),
  sync: (options) =>
    options.muted === undefined ? {} : { muted: options.muted },
  api: (context) => {
    const change = createChange(context)
    return {
      toggle: (event?: Event) => {
        change("muted", !context.store.get().muted, {
          reason: "press",
          ...(event && { event }),
        })
      },
    }
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        type: "button",
        "aria-pressed": String(state.muted),
      }),
      press: ({ api }, event) => api.toggle(event),
    }),
  }),
})

const { Root: Mute } = createParts(muteButton, { root: "button" })
const Tabs = createParts(tabs, {
  root: "div",
  list: "div",
  tab: "button",
  panel: "div",
})

// The adapter's hooks called from this project's own component, so a call
// site this project compiled runs hooks the package's compile slotted.
function HandMute(props: PartProps<"button">) {
  const handle = usePrimitive(muteButton, {})
  return usePart(handle, "root", {}, props, "button")
}

export function App() {
  const [muted, setMuted] = useState(false)
  return (
    <main>
      <Mute id="mute">Mute</Mute>
      <Mute id="controlled" muted={muted} onMutedChange={setMuted}>
        {muted ? "Unmute" : "Mute"}
      </Mute>
      <output id="muted">{String(muted)}</output>
      <HandMute id="hand">Hand</HandMute>
      <Switch id="switch" aria-label="Wi-Fi">
        <SwitchThumb />
      </Switch>
      <Select defaultValue="banana">
        <SelectTrigger id="select" aria-label="Fruit">
          <SelectValue id="select-value" placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent id="select-content">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
      <Tabs.Root defaultValue="a" id="tabs">
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta</Tabs.Tab>
          <Tabs.Tab value="c">Gamma</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
        <Tabs.Panel value="c">Panel C</Tabs.Panel>
      </Tabs.Root>
    </main>
  )
}
