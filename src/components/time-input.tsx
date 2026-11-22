/** @jsxImportSource octane */
// Ported from @ui-sdk/react's time-input (Apache-2.0, 0.1.0-beta.13).
import { timeInput, type TimeInputOptions } from "@ui-sdk/core/time-input"
import type { OctaneNode } from "octane"
import { usePrimitive, type PrimitiveHandle } from "../primitive.js"
import { useFieldControl } from "./field-context.js"
import { defined } from "./octane.js"
import {
  useSegment,
  useSegmentedRoot,
  type RootProps,
  type Segmented,
  type SegmentProps,
} from "./segmented-input.js"

// SAFETY: core builds Time Input with Date Input's slots and state, which is
// all the segmented helpers read; only the options' value types differ, and
// those reach `usePrimitive(timeInput, …)` below with their own type.
const primitive = timeInput as unknown as Segmented

/**
 * The root: a group of segments, hours and minutes, with seconds and AM/PM
 * when shown, and the hidden input the time submits with. Without children it
 * renders every segment; its children can be a function of its state that
 * renders `state.segments`.
 */
function TimeInput({
  value,
  defaultValue,
  onValueChange,
  granularity,
  hourCycle,
  min,
  max,
  locale,
  disabled,
  readOnly,
  required,
  name,
  form,
  controller,
  debug,
  ...props
}: TimeInputOptions & RootProps): OctaneNode {
  const field = useFieldControl()
  const instance = usePrimitive(
    timeInput,
    defined({
      value,
      defaultValue,
      onValueChange,
      granularity,
      hourCycle,
      min,
      max,
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
  // SAFETY: the same instance, seen through `primitive` above.
  const segmented = instance as unknown as PrimitiveHandle<Segmented>
  return useSegmentedRoot(primitive, segmented, field, props, TimeInputSegment)
}

/**
 * A segment, like the hour: an input arrow keys step and digits fill, named
 * by its unit. The text between segments renders as a span.
 */
function TimeInputSegment(props: SegmentProps): OctaneNode {
  return useSegment(primitive, props)
}

export { createTimeInputController } from "@ui-sdk/core/time-input"
export type {
  HourCycle,
  TimeInputApi,
  TimeInputChangeOptions,
  TimeInputController,
  TimeInputGranularity,
  TimeInputOptions,
  TimeInputPrimitive,
  TimeInputSegmentData,
  TimeInputSegmentProps,
  TimeInputSegmentState,
  TimeInputSegmentType,
  TimeInputState,
  TimeInputValueChangeReason,
} from "@ui-sdk/core/time-input"

export { TimeInput, TimeInputSegment }
