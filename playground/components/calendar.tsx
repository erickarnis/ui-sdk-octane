/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Calendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarMonthSelect,
  CalendarNext,
  CalendarPrevious,
  CalendarWeeks,
  CalendarWeekdays,
  CalendarYearSelect,
  type CalendarValue,
} from "../../src/components/calendar"

export function CalendarPage() {
  const [value, setValue] = useState<CalendarValue>("2026-03-15")
  const [range, setRange] = useState<CalendarValue>(null)
  return (
    <main id="page-calendar">
      <section id="basic">
        <Calendar
          id="cal"
          locale="en-US"
          defaultMonth="2026-03"
          min="2026-02-10"
          max="2026-04-20"
          today="2026-03-10"
          weekStartsOn={0}
          unavailable={(date: string) => date === "2026-03-20"}
          value={value}
          onValueChange={(next) => setValue(next)}
        />
        <output id="cal-value">{JSON.stringify(value)}</output>
      </section>
      <section id="range">
        <Calendar id="rcal" mode="range" months={2} locale="en-US" defaultMonth="2026-06" value={range} onValueChange={(next) => setRange(next)}>
          <div>
            <CalendarPrevious id="rcal-prev" />
            <CalendarHeading id="rcal-heading" />
            <CalendarNext id="rcal-next" />
          </div>
          <CalendarGrid id="rcal-grid-0" offset={0} />
          <CalendarGrid id="rcal-grid-1" offset={1}>
            <CalendarWeekdays />
            <CalendarWeeks>{(cell) => <CalendarDay value={cell.date} className="custom-day" />}</CalendarWeeks>
          </CalendarGrid>
        </Calendar>
        <output id="rcal-value">{JSON.stringify(range)}</output>
      </section>
      <section id="selects">
        <Calendar id="scal" locale="en-US" defaultMonth="2026-01" min="2024-01-01" max="2028-12-31">
          <CalendarMonthSelect id="scal-month" aria-label="Month" />
          <CalendarYearSelect id="scal-year" aria-label="Year" />
          <CalendarHeading id="scal-heading" />
          <CalendarGrid />
        </Calendar>
      </section>
    </main>
  )
}
