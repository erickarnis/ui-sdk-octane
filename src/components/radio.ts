/** @jsxImportSource octane */
// Ported from @ui-sdk/react's radio (Apache-2.0, 0.1.0-beta.13). The group's
// type parameter is left out, as in this adapter's parts.
import {
  radioGroup,
  type RadioGroupOptions,
  type RadioGroupState,
  type RadioProps,
  type RadioState,
} from "@ui-sdk/core/radio"
import { createContext, createElement, useContext } from "octane"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import {
  controlRender,
  FieldContext,
  useJoinField,
  type FieldContextValue,
} from "./field-context.js"
import { defined } from "./octane.js"

// The group's own element is its `group` slot, and each radio its `root`.
const parts = createParts(radioGroup, { indicator: "span" })

// The field the group joined, so a radio joins only a field of its own.
const GroupFieldContext = createContext<FieldContextValue | null>(null)

/**
 * Radios that share one value, with one tab stop and arrow keys between them.
 */
function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  required,
  name,
  form,
  loop,
  controller,
  debug,
  render,
  ...props
}: RadioGroupOptions &
  Omit<
    PartProps<"div", RadioGroupState>,
    "defaultValue" | "onChange" | "onSelect"
  >) {
  const groupField = useContext(FieldContext)
  const field = useJoinField(groupField)
  const group = usePrimitive(
    radioGroup,
    defined({
      value,
      defaultValue,
      onValueChange,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      loop,
      controller,
      debug,
    })
  )
  return createElement(
    GroupFieldContext,
    { value: groupField },
    usePart(
      group,
      "group",
      {},
      defined({ ...props, render: controlRender(field, "div", render) })
    )
  )
}

// The hidden native radio that takes part in the form.
function RadioInput(props: RadioProps) {
  return usePart(radioGroup, "input", props, {}, "input")
}

/**
 * A radio and the hidden native radio that takes part in the form.
 */
function Radio({
  value,
  disabled,
  render,
  ...props
}: Omit<PartProps<"button", RadioState>, "value" | "onSelect"> & RadioProps) {
  // A radio in a field of its own is that field's control. In the group's field, the group is.
  const nearest = useContext(FieldContext)
  const groupField = useContext(GroupFieldContext)
  const field = useJoinField(nearest === groupField ? null : nearest)
  const radio = defined({ value, disabled: disabled || field?.disabled })
  const input = createElement(RadioInput, radio)
  return usePart(
    radioGroup,
    "root",
    radio,
    defined({
      ...props,
      render: controlRender(field, "button", render, input),
    }),
    "button"
  )
}

/**
 * The dot inside the radio. Rendered while it's checked, or always with `keepMounted`.
 */
const RadioIndicator = parts.Indicator

export { createRadioGroupController } from "@ui-sdk/core/radio"
export type {
  RadioGroupApi,
  RadioGroupChangeOptions,
  RadioGroupController,
  RadioGroupOptions,
  RadioGroupPrimitive,
  RadioGroupState,
  RadioGroupValueChangeReason,
  RadioIndicatorProps,
  RadioIndicatorState,
  RadioProps,
  RadioState,
} from "@ui-sdk/core/radio"

export { Radio, RadioGroup, RadioIndicator }
