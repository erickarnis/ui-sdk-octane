/** @jsxImportSource octane */
// Ported from @ui-sdk/react's segmented-control (Apache-2.0, 0.1.0-beta.13).
import {
  segmentedControl,
  type SegmentedControlController,
  type SegmentedControlItemProps,
  type SegmentedControlItemState,
  type SegmentedControlOptions,
  type SegmentedControlState,
} from "@ui-sdk/core/segmented-control"
import { useContext, type OctaneNode } from "octane"
import { controlRender, FieldContext, useJoinField } from "./field-context.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { defined } from "./octane.js"

const parts = createParts(segmentedControl, { indicator: "span" })

/**
 * A row of options where exactly one is on, like a radio group drawn as
 * buttons, with an indicator that slides to the checked item.
 * `T` is inferred from `value`, `defaultValue` or `onValueChange`.
 */
function SegmentedControl<T extends string = string>({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  name,
  form,
  loop,
  orientation,
  controller,
  debug,
  render,
  ...props
}: SegmentedControlOptions<T> &
  Omit<
    PartProps<"div", SegmentedControlState>,
    "defaultValue" | "onChange" | "onSelect"
  >): OctaneNode {
  const field = useJoinField(useContext(FieldContext))
  const control = usePrimitive(
    segmentedControl,
    defined({
      value,
      defaultValue,
      // SAFETY: as for `controller` below: the values the instance reports
      // are the ones the app gave its items, which `T` names.
      onValueChange: onValueChange as SegmentedControlOptions["onValueChange"],
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      loop,
      orientation,
      // SAFETY: `T` only names the values the app gave its items. The
      // instance hands the controller those values back, so a controller of
      // `T` is one of `string` for every value it is given.
      controller: controller as SegmentedControlController | undefined,
      debug,
    })
  )
  return usePart(
    control,
    "root",
    {},
    defined({ ...props, render: controlRender(field, "div", render) })
  )
}

function SegmentedControlInput(props: SegmentedControlItemProps) {
  return usePart(segmentedControl, "input", props, {}, "input")
}

/**
 * One option, and the hidden native radio that takes part in the form.
 */
function SegmentedControlItem({
  value,
  disabled,
  render,
  ...props
}: Omit<PartProps<"button", SegmentedControlItemState>, "value" | "onSelect"> &
  SegmentedControlItemProps): OctaneNode {
  const input = <SegmentedControlInput {...defined({ value, disabled })} />
  return usePart(
    segmentedControl,
    "item",
    defined({ value, disabled }),
    defined({
      ...props,
      render: controlRender(null, "button", render, input),
    }),
    "button"
  )
}

/**
 * Sits behind the checked item. Its box comes from the
 * `--segmented-control-indicator-*` variables, measured from the root.
 */
const SegmentedControlIndicator = parts.Indicator

export { createSegmentedControlController } from "@ui-sdk/core/segmented-control"
export type {
  SegmentedControlApi,
  SegmentedControlChangeOptions,
  SegmentedControlController,
  SegmentedControlDirection,
  SegmentedControlIndicatorState,
  SegmentedControlItemProps,
  SegmentedControlItemState,
  SegmentedControlOptions,
  SegmentedControlOrientation,
  SegmentedControlPrimitive,
  SegmentedControlState,
  SegmentedControlValueChangeReason,
} from "@ui-sdk/core/segmented-control"

export { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem }
