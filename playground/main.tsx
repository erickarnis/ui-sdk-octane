/** @jsxImportSource octane */
import { createRoot, useState } from "octane"
import { tabs } from "@ui-sdk/core/tabs"
import { createAgent } from "@ui-sdk/core/agent"
import { createParts, usePart, usePrimitive, type PartProps } from "../src/primitive"
import { muteButton, rating } from "./primitives"

const { Root: MuteButton } = createParts(muteButton, { root: "button" })
const { Root: Rating, Star } = createParts(rating, { root: "div", star: "button" })
const Tabs = createParts(tabs, { root: "div", list: "div", tab: "button", panel: "div" })

// A part written by hand with usePrimitive and usePart.
function HandMute(props: PartProps<"button">) {
  const handle = usePrimitive(muteButton, {})
  return usePart(handle, "root", {}, props, "button")
}

function App() {
  const [muted, setMuted] = useState(false)
  const [stars, setStars] = useState(2)
  const [locked, setLocked] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [shown, setShown] = useState(true)
  return (
    <main>
      <section id="uncontrolled">
        <MuteButton id="mute" className="plain">Mute</MuteButton>
      </section>
      <section id="controlled">
        <MuteButton
          id="cmute"
          muted={muted}
          onMutedChange={(next) => {
            if (!locked) setMuted(next)
          }}
          onClick={() => setLog((l) => [...l, "app-click"])}
        >
          {muted ? "Unmute" : "Mute"}
        </MuteButton>
        <button id="lock" type="button" onClick={() => setLocked(!locked)}>
          {locked ? "Unlock" : "Lock"}
        </button>
        <button id="outside" type="button" onClick={() => setMuted(!muted)}>
          Flip from outside
        </button>
        <output id="log">{log.join(",")}</output>
      </section>
      <section id="hand">
        <HandMute id="hmute" className={(state: object) => "hand " + JSON.stringify(state)}>
          Hand
        </HandMute>
      </section>
      <section id="rating">
        <Rating id="stars" aria-label="Rating" value={stars} onValueChange={(next) => setStars(next)}>
          {["1", "2", "3", "4", "5"].map((value) => (
            <Star key={value} value={value} aria-label={value + " stars"}>
              ★
            </Star>
          ))}
        </Rating>
        <output id="stars-value">{stars}</output>
      </section>
      <section id="mounting">
        <button id="toggle-mount" type="button" onClick={() => setShown(!shown)}>
          Toggle
        </button>
        {shown && <MuteButton id="mounted">Mounted</MuteButton>}
      </section>
      <section id="tabs">
        <Tabs.Root defaultValue="a" id="tabs-root">
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">Alpha</Tabs.Tab>
            <Tabs.Tab
              value="b"
              className={(state) => (state.selected ? "on" : "off")}
            >
              {(state) => (state.selected ? "Beta (open)" : "Beta")}
            </Tabs.Tab>
            <Tabs.Tab value="c" render={<a href="#c" data-custom="yes" />}>Gamma</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Panel A</Tabs.Panel>
          <Tabs.Panel value="b">Panel B</Tabs.Panel>
          <Tabs.Panel value="c">Panel C</Tabs.Panel>
        </Tabs.Root>
      </section>
    </main>
  )
}

Object.assign(window, { agent: createAgent() })
const container = document.getElementById("app")
if (container) createRoot(container).render(<App />)
