/** @jsxImportSource octane */
import { useState } from "octane"
import { TimeInput } from "../../src/components/time-input"
import { SubmitForm } from "./form"

export function TimeInputPage() {
  const [value, setValue] = useState<string | null>("09:30")
  return (
    <main id="page-time-input">
      <SubmitForm id="ti-form">
        <TimeInput id="ti" aria-label="Alarm" name="alarm" locale="en-US" min="08:00" max="18:00" />
      </SubmitForm>
      <section id="controlled">
        <TimeInput
          id="cti"
          aria-label="Controlled"
          locale="en-GB"
          granularity="second"
          value={value}
          onValueChange={(next) => setValue(next)}
        />
        <output id="cti-value">{String(value)}</output>
        <button id="cti-set" type="button" onClick={() => setValue("23:05:10")}>
          Set
        </button>
      </section>
    </main>
  )
}
