/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { Rating, RatingItem } from "../../src/components/rating"
import { SubmitForm } from "./form"

export function RatingPage() {
  const [score, setScore] = useState<number | null>(2.5)
  return (
    <main id="page-rating">
      <SubmitForm id="r-form">
        <Rating id="r" name="stars" aria-label="Stars" defaultValue={3} deselectable>
          <RatingItem style={{ display: "inline-block", width: "24px" }}>*</RatingItem>
        </Rating>
      </SubmitForm>
      <Rating id="cr" aria-label="Half stars" step={0.5} value={score} onValueChange={(next) => setScore(next)}>
        <RatingItem>{(state) => (state.fill === 1 ? "F" : state.fill > 0 ? "P" : "E")}</RatingItem>
      </Rating>
      <output id="cr-value">{String(score)}</output>
      <button id="cr-outside" type="button" onClick={() => setScore(4)}>
        Four
      </button>
      <Rating id="ro" readOnly value={4} max={5} />
      <Field name="quality">
        <FieldLabel id="fr-label">Quality</FieldLabel>
        <Rating id="fr" max={3} />
      </Field>
    </main>
  )
}
