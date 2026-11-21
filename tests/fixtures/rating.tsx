/** @jsxImportSource octane */
// A list of parts with one tab stop, rendered from an array the app can
// grow, shrink and reorder.
import { useState } from "octane"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"
import { rating } from "./primitives"

const { Root: Rating, Star } = createParts(rating, { root: "div", star: "button" })

export default function Fixture() {
  const [stars, setStars] = useState(2)
  const [values, setValues] = useState(["1", "2", "3", "4", "5"])
  return (
    <main>
      <button id="before" type="button">
        Before
      </button>
      <Rating
        id="stars"
        aria-label="Rating"
        value={stars}
        onValueChange={(next, details) => {
          called("onValueChange", next, details.reason)
          setStars(next)
        }}
      >
        {values.map((value) => (
          <Star key={value} value={value} aria-label={`${value} stars`}>
            ★
          </Star>
        ))}
      </Rating>
      <output id="stars-value">{stars}</output>
      <button id="after" type="button">
        After
      </button>

      <section aria-label="the list">
        <button id="grow" type="button" onClick={() => setValues([...values, String(values.length + 1)])}>
          Add a star
        </button>
        <button id="shrink" type="button" onClick={() => setValues(values.slice(0, -1))}>
          Remove the last star
        </button>
        <button id="reverse" type="button" onClick={() => setValues([...values].reverse())}>
          Reverse the stars
        </button>
      </section>

      <Rating id="free" aria-label="Uncontrolled rating">
        <Star value="1" aria-label="1 of 3">
          ★
        </Star>
        <Star value="2" aria-label="2 of 3">
          ★
        </Star>
        <Star value="3" aria-label="3 of 3">
          ★
        </Star>
      </Rating>
    </main>
  )
}
