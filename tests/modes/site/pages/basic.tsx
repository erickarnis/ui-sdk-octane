/** @jsxImportSource octane */
// Every kind of part the playground has, with state that differs from the
// defaults, so a server render that ignored options would show.
import { useState } from "octane"
import { usePart, usePrimitive, type PartProps } from "../../../../src/primitive"
import { Labelled, MuteButton, Rating, Star, Tabs, muteButton } from "../parts"

function HandMute(props: PartProps<"button">) {
  const handle = usePrimitive(muteButton, {})
  return usePart(handle, "root", {}, props, "button")
}

export function Page() {
  const [muted, setMuted] = useState(true)
  const [stars, setStars] = useState(4)
  return (
    <main>
      <MuteButton id="mute" className="plain">Mute</MuteButton>
      <MuteButton id="cmute" muted={muted} onMutedChange={setMuted}>
        {muted ? "Unmute" : "Mute"}
      </MuteButton>
      <HandMute id="hmute" className={(state: object) => "hand " + JSON.stringify(state)}>
        Hand
      </HandMute>
      <Rating id="stars" aria-label="Rating" value={stars} onValueChange={(next) => setStars(next)}>
        {["1", "2", "3", "4", "5"].map((value) => (
          <Star key={value} value={value} aria-label={value + " stars"}>★</Star>
        ))}
      </Rating>
      <output id="stars-value">{stars}</output>
      <Tabs.Root defaultValue="b" id="tabs">
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b" className={(state) => (state.selected ? "on" : "off")}>
            {(state: { selected: boolean }) => (state.selected ? "Beta (open)" : "Beta")}
          </Tabs.Tab>
          <Tabs.Tab value="c" render={<a href="#c" data-custom="yes" />}>Gamma</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Panel A</Tabs.Panel>
        <Tabs.Panel value="b">Panel B</Tabs.Panel>
        <Tabs.Panel value="c">Panel C</Tabs.Panel>
      </Tabs.Root>
      <Labelled.Root id="labelled">
        <Labelled.Field id="field-1">One</Labelled.Field>
        <Labelled.Field id="field-2">Two</Labelled.Field>
      </Labelled.Root>
    </main>
  )
}
