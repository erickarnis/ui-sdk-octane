// Ported from @ui-sdk/react's calendar-context (Apache-2.0, 0.1.0-beta.13).
import type {
  calendar as calendarPrimitive,
  CalendarGridState,
} from "@ui-sdk/core/calendar"
import { createContext } from "octane"
import type { PrimitiveHandle } from "../primitive.js"

// The calendar the parts render: a Calendar, or the one inside a Date Picker,
// whose primitive has the same parts.
type CalendarHandle = PrimitiveHandle<typeof calendarPrimitive>

const CalendarContext = createContext<CalendarHandle | null>(null)
const GridContext = createContext<{
  offset: number
  state: CalendarGridState
} | null>(null)

export { CalendarContext, type CalendarHandle, GridContext }
