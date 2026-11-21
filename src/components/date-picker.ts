/** @jsxImportSource octane */
// Ported from @ui-sdk/react's date-picker (Apache-2.0, 0.1.0-beta.13).
import {
  datePicker as datePickerPrimitive,
  type DatePickerContentProps,
  type DatePickerContentState,
  type DatePickerHintState,
  type DatePickerInputProps,
  type DatePickerInputState,
  type DatePickerOptions,
  type DatePickerPresetState,
  type DatePickerState,
  type DatePickerTriggerState,
  type DatePickerValue,
} from "@ui-sdk/core/date-picker"
import {
  createContext,
  createElement,
  Fragment,
  useContext,
  useMemo,
  type OctaneNode,
} from "octane"
import { extendHandle, slotIn } from "../internal.js"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import {
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
} from "./calendar.js"
import { CalendarContext, type CalendarHandle } from "./calendar-context.js"
import { ownDescription, useFieldControl } from "./field-context.js"
import { contentOf, defined } from "./octane.js"
import {
  renderPopup,
  sheetViewport,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(datePickerPrimitive, { clear: "button" })

type DatePickerContextValue = PrimitiveHandle<typeof datePickerPrimitive> & {
  field: ReturnType<typeof useFieldControl>
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null)
// Where the popup renders. Set on <DatePicker> or <DatePickerContent>.
const ContainerContext = createContext<PopupContainer>(undefined)

function useDatePicker(part: string) {
  const context = useContext(DatePickerContext)
  if (!context) throw new Error(`${part} must be used inside <DatePicker>.`)
  return context
}

/**
 * The root, and the hidden inputs that submit ISO dates. Without children it
 * renders an input, or two in range mode, the trigger and the popup.
 */
function DatePicker({
  mode,
  value,
  defaultValue,
  onValueChange,
  month,
  defaultMonth,
  onMonthChange,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  closeOnSelect,
  presentation,
  dismissible,
  onDismissAttempt,
  min,
  max,
  unavailable,
  disabled,
  readOnly,
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
  name,
  startName,
  endName,
  form,
  required,
  container,
  controller,
  debug,
  children,
  ...props
}: DatePickerOptions &
  Omit<
    PartProps<"div", DatePickerState>,
    "defaultValue" | "onChange"
  >): OctaneNode {
  const field = useFieldControl()
  const picker = usePrimitive(
    datePickerPrimitive,
    defined({
      mode,
      value,
      defaultValue,
      onValueChange,
      month,
      defaultMonth,
      onMonthChange,
      open,
      defaultOpen,
      onOpenChange,
      onOpenChangeComplete,
      closeOnSelect,
      presentation,
      dismissible,
      onDismissAttempt,
      min,
      max,
      unavailable,
      disabled: disabled || field?.disabled,
      readOnly,
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
      name: name ?? field?.name,
      startName,
      endName,
      form,
      required,
      controller,
      debug,
    })
  )
  const context = useMemo(
    () => extendHandle(picker, { field }),
    [picker, field]
  )
  // SAFETY: core builds the date picker with the calendar's slots, which is
  // all the Calendar parts inside read through this context.
  const calendar = picker as unknown as CalendarHandle
  const content = (state: DatePickerState) => {
    const range = state.mode === "range"
    const submitsStart = range
      ? (startName ?? name ?? field?.name)
      : (name ?? field?.name)
    const submitsEnd = range && (endName ?? name ?? field?.name)
    return createElement(
      Fragment,
      null,
      children === undefined
        ? createElement(
            Fragment,
            null,
            createElement(DatePickerInput, {}),
            range ? createElement(DatePickerInput, { end: true }) : null,
            createElement(DatePickerTrigger, {}),
            createElement(DatePickerContent, {})
          )
        : contentOf(children, state),
      submitsStart
        ? createElement(
            "input",
            slotIn(picker, "hidden-input", { id: "start" })
          )
        : null,
      submitsEnd
        ? createElement(
            "input",
            slotIn(picker, "hidden-input", { end: true, id: "end" })
          )
        : null
    )
  }
  return createElement(
    DatePickerContext,
    { value: context },
    createElement(
      CalendarContext,
      { value: calendar },
      createElement(
        ContainerContext,
        { value: container },
        usePart(picker, "root", {}, { ...props, children: content })
      )
    )
  )
}

/**
 * A text input that reads a date typed in the page's language on Enter or
 * blur. `end` makes it a range's end.
 */
function DatePickerInput({
  end,
  render,
  ...props
}: Omit<
  PartProps<"input", DatePickerInputState>,
  "value" | "defaultValue" | "children" | "readOnly"
> &
  DatePickerInputProps): OctaneNode {
  const picker = useDatePicker("DatePickerInput")
  // Field names the first input. The core writes the text as it changes, so Octane only renders where it starts.
  const input = (merged: Props, state: DatePickerInputState) => {
    const field = picker.field && !end ? picker.field : undefined
    const [own, element] = field
      ? ownDescription(merged, render)
      : [merged, render]
    const attrs: Props = field ? field.props(own) : own
    const { value, ...rest } = attrs
    return renderElement(
      "input",
      { ...rest, defaultValue: value },
      element,
      state
    )
  }
  return usePart(
    picker,
    "input",
    defined({ end, id: end ? "end" : "start" }),
    { ...props, render: input },
    "input"
  )
}

const calendarIcon = createElement(
  "svg",
  {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    "aria-hidden": "true",
  },
  createElement("rect", {
    x: "2",
    y: "3",
    width: "12",
    height: "11",
    rx: "1.5",
  }),
  createElement("path", { d: "M2 6.5h12M5.5 1.5v3M10.5 1.5v3" })
)

/**
 * Opens the calendar. Named "Choose date" and the date chosen; pass `aria-label` in another language.
 */
function DatePickerTrigger({
  children = calendarIcon,
  ...props
}: Omit<
  PartProps<"button", DatePickerTriggerState>,
  "value" | "defaultValue" | "onChange"
>): OctaneNode {
  return usePart(
    useDatePicker("DatePickerTrigger"),
    "trigger",
    {},
    { ...props, children },
    "button"
  )
}

/**
 * The popup. Without children it renders Previous, the heading, Next and a
 * grid for each month; every Calendar part works inside it.
 */
function DatePickerContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  finalFocus,
  keepMounted,
  container,
  render,
  children,
  ...props
}: PartProps<"div", DatePickerContentState> &
  DatePickerContentProps): OctaneNode {
  const picker = useDatePicker("DatePickerContent")
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    finalFocus,
    keepMounted,
  })
  const { months } = picker.state
  const body =
    children === undefined
      ? createElement(
          Fragment,
          null,
          createElement(
            "div",
            null,
            createElement(CalendarPrevious, {}),
            createElement(CalendarHeading, {}),
            createElement(CalendarNext, {})
          ),
          Array.from({ length: months }, (_, offset) =>
            createElement(
              Fragment,
              { key: offset },
              createElement(CalendarGrid, { offset })
            )
          )
        )
      : children
  const element = usePart(picker, "content", content, {
    ...props,
    children: body,
    render: sheetViewport(picker, render),
  })
  return element && renderPopup(element, target)
}

/**
 * The format to type, like "MM/DD/YYYY". The inputs are described by it.
 */
function DatePickerHint({
  children = placeholder,
  ...props
}: PartProps<"span", DatePickerHintState>): OctaneNode {
  return usePart(
    useDatePicker("DatePickerHint"),
    "hint",
    {},
    { ...props, children },
    "span"
  )
}

const placeholder = (state: DatePickerHintState) => state.placeholder

/**
 * Clears the value and focuses the input.
 */
const DatePickerClear = parts.Clear

/**
 * Selects the value it holds, like the last 7 days.
 */
function DatePickerPreset({
  value,
  ...props
}: Omit<
  PartProps<"button", DatePickerPresetState>,
  "value" | "defaultValue" | "onChange"
> & {
  value: DatePickerValue
}): OctaneNode {
  // Presets are told apart by their value.
  return usePart(
    datePickerPrimitive,
    "preset",
    { value, id: JSON.stringify(value) },
    props,
    "button"
  )
}

export {
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
} from "./calendar.js"
export { createDatePickerController } from "@ui-sdk/core/date-picker"
export type {
  CalendarDayState,
  CalendarGridCell,
  CalendarGridState,
  CalendarHeadingState,
  CalendarSelectOption,
  CalendarSelectState,
  CalendarStepState,
  CalendarWeekdayState,
  DateMatcher,
  DateMatchers,
  DatePickerApi,
  DatePickerChangeOptions,
  DatePickerClearState,
  DatePickerContentProps,
  DatePickerContentState,
  DatePickerController,
  DatePickerDismissReason,
  DatePickerHintState,
  DatePickerInputProps,
  DatePickerInputState,
  DatePickerMode,
  DatePickerMonthChangeReason,
  DatePickerOpenChangeReason,
  DatePickerOptions,
  DatePickerPresetProps,
  DatePickerPresetState,
  DatePickerPrimitive,
  DatePickerState,
  DatePickerTriggerState,
  DatePickerValue,
  DatePickerValueChangeReason,
  ISOMonth,
} from "@ui-sdk/core/date-picker"

export {
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerPreset,
  DatePickerTrigger,
}
