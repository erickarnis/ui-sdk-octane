/** @jsxImportSource octane */
// Live state: `hovered` changes an attribute core writes to the element
// itself, so hovering renders no seat again. A part whose children function
// reads `hovered` renders again; one that reads only `value` doesn't.
import { createParts } from "../../src/primitive"
import { called, rendered } from "../app/harness"
import { seats } from "./primitives"

const Seats = createParts(seats, { root: "div", seat: "button", label: "p" })

export default function Fixture() {
  return (
    <main>
      <Seats.Root
        id="seats"
        aria-label="Seats"
        defaultValue="B"
        onValueChange={(value, details) => called("onValueChange", value, details.reason)}
      >
        {["A", "B", "C"].map((seat) => (
          <Seats.Seat key={seat} value={seat} id={`seat-${seat}`}>
            {() => {
              rendered(`seat ${seat}`)
              return `Seat ${seat}`
            }}
          </Seats.Seat>
        ))}
        <Seats.Label id="hovering">
          {(state: { hovered: string | null }) => {
            rendered("hovering label")
            return state.hovered ? `Hovering ${state.hovered}` : "Hovering nothing"
          }}
        </Seats.Label>
        <Seats.Label id="chosen">
          {(state: { value: string }) => {
            rendered("chosen label")
            return `Chosen ${state.value}`
          }}
        </Seats.Label>
      </Seats.Root>
      <p id="elsewhere">Somewhere else to point</p>
    </main>
  )
}
