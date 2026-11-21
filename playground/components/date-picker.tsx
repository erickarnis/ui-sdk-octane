/** @jsxImportSource octane */
import { useState } from "octane"
import {
  CalendarGrid,
  CalendarHeading,
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerPreset,
  DatePickerTrigger,
  type DatePickerValue,
} from "../../src/components/date-picker"
import { Field, FieldLabel } from "../../src/components/field"
import { SubmitForm } from "./form"

export function DatePickerPage() {
  const [value, setValue] = useState<DatePickerValue>(null)
  const [open, setOpen] = useState(false)
  return (
    <main id="page-date-picker">
      <SubmitForm id="dp-form">
        <Field>
          <FieldLabel id="dp-label">Due date</FieldLabel>
          <DatePicker
            id="dp"
            name="due"
            locale="en-US"
            defaultMonth="2026-03"
            today="2026-03-10"
            min="2026-03-05"
            max="2026-04-25"
          />
        </Field>
      </SubmitForm>
      <section id="range">
        <DatePicker
          id="rdp"
          mode="range"
          locale="en-US"
          defaultMonth="2026-06"
          months={2}
          value={value}
          onValueChange={(next) => setValue(next)}
          open={open}
          onOpenChange={(next) => setOpen(next)}
        >
          <DatePickerInput id="rdp-start" aria-label="Start" />
          <DatePickerInput id="rdp-end" end aria-label="End" />
          <DatePickerHint id="rdp-hint" />
          <DatePickerTrigger id="rdp-trigger" />
          <DatePickerClear id="rdp-clear">Clear</DatePickerClear>
          <DatePickerContent id="rdp-content">
            <CalendarHeading id="rdp-heading" />
            <CalendarGrid offset={0} />
            <CalendarGrid offset={1} />
            <DatePickerPreset id="rdp-week" value={["2026-06-01", "2026-06-07"]}>
              First week
            </DatePickerPreset>
          </DatePickerContent>
        </DatePicker>
        <output id="rdp-value">{JSON.stringify(value)}</output>
        <output id="rdp-open">{String(open)}</output>
      </section>
    </main>
  )
}
