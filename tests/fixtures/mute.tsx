/** @jsxImportSource octane */
// One-part primitives: a button with a boolean, uncontrolled, controlled,
// refusing, written by hand, mounted and unmounted, and twice on a page.
import { useState } from "octane"
import { createParts, usePart, usePrimitive, type PartProps } from "../../src/primitive"
import { called } from "../app/harness"
import { muteButton } from "./primitives"

const { Root: MuteButton } = createParts(muteButton, { root: "button" })

// The same part written with the hooks `createParts` is made of.
function HandMute(props: PartProps<"button", { muted: boolean }>) {
  const handle = usePrimitive(muteButton, {})
  return usePart(handle, "root", {}, props, "button")
}

export default function Fixture() {
  const [muted, setMuted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [shown, setShown] = useState(true)
  return (
    <main>
      <section aria-label="uncontrolled">
        <MuteButton id="mute" className="plain">
          Mute
        </MuteButton>
        <MuteButton id="second">Second</MuteButton>
        <MuteButton id="starts-muted" defaultMuted>
          Starts muted
        </MuteButton>
        <MuteButton id="disabled" disabled>
          Disabled
        </MuteButton>
      </section>

      <section aria-label="controlled">
        <MuteButton
          id="controlled"
          muted={muted}
          onMutedChange={(next, details) => {
            called("onMutedChange", next, details.reason)
            if (!locked) setMuted(next)
          }}
          onClick={() => called("onClick")}
        >
          {muted ? "Unmute" : "Mute"}
        </MuteButton>
        <button id="lock" type="button" onClick={() => setLocked(!locked)}>
          {locked ? "Unlock" : "Lock"}
        </button>
        <button id="outside" type="button" onClick={() => setMuted(!muted)}>
          Flip from outside
        </button>
      </section>

      <section aria-label="refusing">
        <MuteButton
          id="refuser"
          onMutedChange={(next, details) => {
            if (refusing) details.cancel()
            called("onMutedChange", next, refusing ? "refused" : "accepted")
          }}
        >
          Refuser
        </MuteButton>
        <button id="refuse" type="button" onClick={() => setRefusing(!refusing)}>
          {refusing ? "Accept changes" : "Refuse changes"}
        </button>
        <MuteButton
          id="prevented"
          onClick={(event) => {
            called("prevented click")
            event.preventDefault()
          }}
        >
          Prevented
        </MuteButton>
      </section>

      <section aria-label="hand-written">
        <HandMute
          id="hand"
          className={(state) => (state.muted ? "hand muted" : "hand")}
        >
          Hand
        </HandMute>
      </section>

      <section aria-label="mounting">
        <button id="toggle-mount" type="button" onClick={() => setShown(!shown)}>
          {shown ? "Unmount" : "Mount"}
        </button>
        {shown && <MuteButton id="mounted">Mounted</MuteButton>}
      </section>
    </main>
  )
}
