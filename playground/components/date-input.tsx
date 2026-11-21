/** @jsxImportSource octane */
import { useState } from "octane"
import { DateInput, DateInputSegment } from "../../src/components/date-input"
import { Field, FieldLabel } from "../../src/components/field"
import { SubmitForm } from "./form"

export function DateInputPage() {
  const [value, setValue] = useState<string | null>("2026-03-15")
  return (
    <main id="page-date-input">
      <SubmitForm id="di-form">
        <Field>
          <FieldLabel id="di-label">Start date</FieldLabel>
          <DateInput id="di" name="start" locale="en-US" min="2026-01-10" max="2026-12-20" />
        </Field>
      </SubmitForm>
      <section id="controlled">
        <DateInput
          id="cdi"
          aria-label="Controlled"
          locale="en-US"
          value={value}
          onValueChange={(next) => setValue(next)}
        />
        <output id="cdi-value">{String(value)}</output>
        <button id="cdi-set" type="button" onClick={() => setValue("2027-07-04")}>
          Set
        </button>
      </section>
      <section id="custom">
        <DateInput id="xdi" aria-label="Custom" locale="de-DE" defaultValue="2026-05-01">
          {(state) =>
            state.segments.map((segment) => (
              <DateInputSegment key={segment.key} segment={segment} className={`seg-${segment.type}`} />
            ))
          }
        </DateInput>
      </section>
    </main>
  )
}
