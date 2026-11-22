/** @jsxImportSource octane */
// Ported from @ui-sdk/react's date-input (Apache-2.0, 0.1.0-beta.13).
import { dateInput, type DateInputOptions } from "@ui-sdk/core/date-input"
import type { OctaneNode } from "octane"
import { usePrimitive } from "../primitive.js"
import { useFieldControl } from "./field-context.js"
import { defined } from "./octane.js"
import {
  useSegment,
  useSegmentedRoot,
  type RootProps,
  type SegmentProps,
} from "./segmented-input.js"

/**
 * The root: a group of segments the locale orders, like month, day and year,
 * and the hidden input the ISO value submits with. Without children it renders
 * every segment; its children can be a function of its state that renders
 * `state.segments`.
 */
function DateInput({
  value,
  defaultValue,
  onValueChange,
  granularity,
  hourCycle,
  min,
  max,
  unavailable,
  locale,
  disabled,
  readOnly,
  required,
  name,
  form,
  controller,
  debug,
  ...props
}: DateInputOptions & RootProps): OctaneNode {
  const field = useFieldControl()
  const instance = usePrimitive(
    dateInput,
    defined({
      value,
      defaultValue,
      onValueChange,
      granularity,
      hourCycle,
      min,
      max,
      unavailable,
      locale,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      controller,
      debug,
    })
  )
  return useSegmentedRoot(dateInput, instance, field, props, DateInputSegment)
}

/**
 * A segment, like the month: an input arrow keys step and digits fill, named
 * by its unit. The text between segments renders as a span.
 */
function DateInputSegment(props: SegmentProps): OctaneNode {
  return useSegment(dateInput, props)
}

export { createDateInputController } from "@ui-sdk/core/date-input"
export type {
  DateInputApi,
  DateInputChangeOptions,
  DateInputController,
  DateInputGranularity,
  DateInputOptions,
  DateInputPrimitive,
  DateInputSegmentData,
  DateInputSegmentProps,
  DateInputSegmentState,
  DateInputSegmentType,
  DateInputState,
  DateInputValueChangeReason,
  DateMatcher,
  DateMatchers,
  HourCycle,
} from "@ui-sdk/core/date-input"

export { DateInput, DateInputSegment }
