/** @jsxImportSource octane */
// Ported from @ui-sdk/react's calendar (Apache-2.0, 0.1.0-beta.13).
import {
  calendar as calendarPrimitive,
  type CalendarDayState,
  type CalendarGridCell,
  type CalendarGridState,
  type CalendarHeadingState,
  type CalendarOptions,
  type CalendarSelectState,
  type CalendarState,
  type CalendarStepState,
  type CalendarWeekdayState,
} from "@ui-sdk/core/calendar"
import {
  Fragment,
  useContext,
  useMemo,
  type ComponentProps,
  type OctaneNode,
} from "octane"
import * as internal from "../internal.js"
import {
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { CalendarContext, GridContext } from "./calendar-context.js"
import { contentOf, defined } from "./octane.js"

function useCalendar(part: string) {
  const context = useContext(CalendarContext)
  if (!context)
    throw new Error(
      `${part} must be used inside <Calendar> or <DatePickerContent>.`
    )
  return context
}

function useGrid(part: string) {
  const context = useContext(GridContext)
  if (!context) throw new Error(`${part} must be used inside <CalendarGrid>.`)
  return context
}

/**
 * Months of days with one tab stop. Without children it renders a heading,
 * Previous and Next, and a grid for each month.
 */
function Calendar({
  mode,
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  min,
  max,
  unavailable,
  disabled,
  readOnly,
  deselectable,
  onFocusedChange,
  onAnchorChange,
  months,
  pageBy,
  locale,
  weekStartsOn,
  weekdayFormat,
  monthFormat,
  fixedWeeks,
  showOutsideDays,
  today,
  timeZone,
  minDays,
  maxDays,
  allowUnavailable,
  controller,
  debug,
  children,
  ...props
}: CalendarOptions &
  Omit<PartProps<"div", CalendarState>, "defaultValue">): OctaneNode {
  const calendar = usePrimitive(
    calendarPrimitive,
    defined({
      mode,
      value,
      defaultValue,
      onValueChange,
      month,
      defaultMonth,
      onMonthChange,
      min,
      max,
      unavailable,
      disabled,
      readOnly,
      deselectable,
      onFocusedChange,
      onAnchorChange,
      months,
      pageBy,
      locale,
      weekStartsOn,
      weekdayFormat,
      monthFormat,
      fixedWeeks,
      showOutsideDays,
      today,
      timeZone,
      minDays,
      maxDays,
      allowUnavailable,
      controller,
      debug,
    })
  )
  const content =
    children === undefined ? (
      <>
        <div>
          <CalendarPrevious />
          <CalendarHeading />
          <CalendarNext />
        </div>
        {Array.from(
          { length: Math.max(1, Math.floor(months ?? 1) || 1) },
          (_, offset) => (
            <Fragment key={offset}>
              <CalendarGrid offset={offset} />
            </Fragment>
          )
        )}
      </>
    ) : (
      children
    )
  const root = usePart(calendar, "root", {}, { ...props, children: content })
  // In a context of its own, since a Date Picker renders the same parts over its own primitive.
  return <CalendarContext value={calendar}>{root}</CalendarContext>
}

/**
 * The months shown, like "October 2026". Screen readers hear it change.
 */
function CalendarHeading({
  children = label,
  ...props
}: PartProps<"h2", CalendarHeadingState>): OctaneNode {
  return usePart(
    useCalendar("CalendarHeading"),
    "heading",
    {},
    { ...props, children },
    "h2"
  )
}

const label = (state: { label: string }) => state.label

type SelectProps = Omit<
  PartProps<"select", CalendarSelectState>,
  "value" | "defaultValue"
>

function useSelect(
  name: "month-select" | "year-select",
  part: string,
  { render, children = options, ...props }: SelectProps
) {
  // The core writes the selected option as it changes, so Octane only renders where it starts.
  const select = ({ value, ...attrs }: Props, state: CalendarSelectState) =>
    renderElement("select", { ...attrs, defaultValue: value }, render, state)
  return usePart(
    useCalendar(part),
    name,
    {},
    { ...props, children, render: select },
    "select"
  )
}

const options = (state: CalendarSelectState) =>
  state.options.map((option) => (
    <option
      key={option.value}
      {...defined({ value: option.value, disabled: option.disabled })}
    >
      {option.label}
    </option>
  ))

/**
 * A native select of the months, in the locale, that turns the first month shown.
 */
function CalendarMonthSelect(props: SelectProps): OctaneNode {
  return useSelect("month-select", "CalendarMonthSelect", props)
}

/**
 * A native select of the years from `min` to `max`, or 10 either side of the year shown.
 */
function CalendarYearSelect(props: SelectProps): OctaneNode {
  return useSelect("year-select", "CalendarYearSelect", props)
}

type StepProps = PartProps<"button", CalendarStepState>

function useStep(
  name: "previous" | "next",
  part: string,
  { children, ...props }: StepProps
) {
  const content = children ?? (name === "previous" ? "‹" : "›")
  return usePart(
    useCalendar(part),
    name,
    {},
    { ...props, children: content },
    "button"
  )
}

/**
 * Shows the month before. Named "Previous month"; pass `aria-label` in another language.
 */
function CalendarPrevious(props: StepProps): OctaneNode {
  return useStep("previous", "CalendarPrevious", props)
}

/**
 * Shows the month after. Named "Next month"; pass `aria-label` in another language.
 */
function CalendarNext(props: StepProps): OctaneNode {
  return useStep("next", "CalendarNext", props)
}

/**
 * One month's grid, a table. `offset` picks which of the months shown, from 0.
 * Without children it renders its weekdays and weeks.
 */
function CalendarGrid({
  offset = 0,
  children = defaultGrid,
  ...props
}: PartProps<"table", CalendarGridState> & { offset?: number }): OctaneNode {
  // Grids are told apart by their offset. The parts inside read the grid's state.
  const content = (state: CalendarGridState) => {
    // Read now: JSX reads its children only when Octane renders the element.
    const body = contentOf<CalendarGridState>(children, state)
    return (
      <GridScope offset={offset} state={state}>
        {body}
      </GridScope>
    )
  }
  return usePart(
    useCalendar("CalendarGrid"),
    "grid",
    { offset, id: String(offset) },
    { ...props, children: content },
    "table"
  )
}

// A function, as upstream's element would be built before the parts it names.
function defaultGrid() {
  return (
    <>
      <CalendarWeekdays />
      <CalendarWeeks />
    </>
  )
}

function GridScope({
  offset,
  state,
  children,
}: {
  offset: number
  state: CalendarGridState
  children?: OctaneNode
}) {
  const grid = useMemo(
    () => ({ offset, state }),
    // The grid's state is new on every render; these are what it shows.
    [offset, state.month, state.weeks]
  )
  return <GridContext value={grid}>{children}</GridContext>
}

/**
 * The header row of weekday names, a weekday in each column. Its children can
 * be a function of the column's index that renders it, like
 * `(index) => <CalendarWeekday index={index} className="…" />`.
 */
function CalendarWeekdays({
  children,
  ...props
}: Omit<ComponentProps<"thead">, "children"> & {
  children?: (index: number) => OctaneNode
}): OctaneNode {
  const calendar = useCalendar("CalendarWeekdays")
  const { offset, state } = useGrid("CalendarWeekdays")
  // Read now: JSX reads its children only when Octane renders the element.
  const row = internal.slotIn(calendar, "weekdays", { id: String(offset) })
  const weekdays = state.weekdays.map((weekday, index) => (
    <Fragment key={weekday}>
      {children ? children(index) : <CalendarWeekday index={index} />}
    </Fragment>
  ))
  return (
    <thead {...props}>
      <tr {...row}>{weekdays}</tr>
    </thead>
  )
}

/**
 * A weekday's column header. Shows its name in `weekdayFormat` unless it has children.
 */
function CalendarWeekday({
  index,
  children = label,
  ...props
}: PartProps<"th", CalendarWeekdayState> & { index: number }): OctaneNode {
  const { offset } = useGrid("CalendarWeekday")
  const part = { index, id: `${offset}-${index}` }
  return usePart(
    useCalendar("CalendarWeekday"),
    "weekday",
    part,
    { scope: "col", ...props, children },
    "th"
  )
}

/**
 * The weeks of the grid's month, a row each, with a day in each cell. Its
 * children can be a function of a cell that renders its day, like
 * `(cell) => <CalendarDay value={cell.date} className="…" />`. A cell that
 * shows nothing stays an empty cell.
 */
function CalendarWeeks({
  children,
  ...props
}: Omit<ComponentProps<"tbody">, "children"> & {
  children?: (cell: CalendarGridCell) => OctaneNode
}): OctaneNode {
  const calendar = useCalendar("CalendarWeeks")
  const { offset, state } = useGrid("CalendarWeeks")
  // Read now: JSX reads its children only when Octane renders the element.
  const weeks = state.weeks.map((week, index) => {
    const row = internal.slotIn(calendar, "week", { id: `${offset}-${index}` })
    const cells = week.map((cell) =>
      cell.hidden ? (
        <td key={cell.date} />
      ) : (
        <Fragment key={cell.date}>
          {children ? children(cell) : <CalendarDay value={cell.date} />}
        </Fragment>
      )
    )
    return (
      <tr key={week[0]?.date ?? index} {...row}>
        {cells}
      </tr>
    )
  })
  return <tbody {...props}>{weeks}</tbody>
}

/**
 * A day. Shows the day of the month unless it has children; arrow keys move between days.
 */
function CalendarDay({
  value,
  children = label,
  ...props
}: PartProps<"td", CalendarDayState> & { value: string }): OctaneNode {
  const grid = useContext(GridContext)
  const part = { value, offset: grid?.offset ?? 0 }
  return usePart(
    useCalendar("CalendarDay"),
    "day",
    part,
    { ...props, children },
    "td"
  )
}

export { createCalendarController } from "@ui-sdk/core/calendar"
export type {
  CalendarAnchorChangeReason,
  CalendarApi,
  CalendarChangeOptions,
  CalendarController,
  CalendarDayProps,
  CalendarDayState,
  CalendarFocusedChangeReason,
  CalendarGridCell,
  CalendarGridProps,
  CalendarGridState,
  CalendarHeadingState,
  CalendarMode,
  CalendarMonthChangeReason,
  CalendarOptions,
  CalendarPrimitive,
  CalendarSelectOption,
  CalendarSelectState,
  CalendarState,
  CalendarStepState,
  CalendarValue,
  CalendarValueChangeReason,
  CalendarWeekdayProps,
  CalendarWeekdayState,
  DateMatcher,
  DateMatchers,
  ISOMonth,
} from "@ui-sdk/core/calendar"

export {
  Calendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarMonthSelect,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  CalendarYearSelect,
}
