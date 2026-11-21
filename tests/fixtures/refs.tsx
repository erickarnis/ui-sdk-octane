/** @jsxImportSource octane */
// The app's own refs on parts, and parts that remount: a part stays bound to
// its element while the app's ref changes under it.
import { useCallback, useRef, useState } from "octane"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"
import { muteButton, rating } from "./primitives"

const { Root: MuteButton } = createParts(muteButton, { root: "button" })
const { Root: Rating, Star } = createParts(rating, { root: "div", star: "button" })

export default function Fixture() {
  const [renders, setRenders] = useState(0)
  const [version, setVersion] = useState(0)
  const [first, setFirst] = useState(true)
  const object = useRef<HTMLButtonElement | null>(null)
  const stable = useCallback((el: HTMLButtonElement | null) => {
    called("stable ref", el)
  }, [])
  return (
    <main>
      <button id="again" type="button" onClick={() => setRenders(renders + 1)}>
        Render again ({renders})
      </button>

      <section id="inline">
        <Rating aria-label="Stars with inline refs" defaultValue={1}>
          {["1", "2", "3"].map((value) => (
            <Star
              key={value}
              value={value}
              aria-label={`${value} of 3`}
              // A new function on every render, as apps write them.
              ref={(el) => {
                if (value === "1") called("inline ref", el ? "attached" : "detached")
              }}
            >
              ★
            </Star>
          ))}
        </Rating>
      </section>

      <section id="held">
        <MuteButton id="object" ref={object}>
          Object ref
        </MuteButton>
        <MuteButton id="stable" ref={stable}>
          Stable callback ref
        </MuteButton>
        <button id="read" type="button" onClick={() => called("object ref holds", object.current)}>
          Read the object ref
        </button>
      </section>

      <section id="keyed">
        <MuteButton key={version} id="remounted">
          Version {version}
        </MuteButton>
        <button id="remount" type="button" onClick={() => setVersion(version + 1)}>
          Remount with a new key
        </button>
      </section>

      <section id="branches">
        {first ? (
          <MuteButton id="branch" className="first" defaultMuted>
            First branch
          </MuteButton>
        ) : (
          <MuteButton id="branch" className="second">
            Second branch
          </MuteButton>
        )}
        <button id="swap" type="button" onClick={() => setFirst(!first)}>
          Swap branches
        </button>
      </section>
    </main>
  )
}
