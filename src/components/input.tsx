/** @jsxImportSource octane */
// Ported from @ui-sdk/react's input (Apache-2.0, 0.1.0-beta.13).
import type { OctaneNode } from "octane"
import {
  input as inputPrimitive,
  inputGroup,
  type InputGroupOptions,
  type InputGroupState,
  type InputOptions,
  type InputState,
} from "@ui-sdk/core/input"
import { controlRender, useFieldControl } from "./field-context.js"
import { controlProps, elementProps, type Native } from "./text-control.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { defined } from "./octane.js"

/**
 * A native <input>, wired to the Field it's in.
 */
function Input({
  value,
  defaultValue,
  onValueChange,
  controller,
  debug,
  render,
  ...props
}: InputOptions & Native<"input", InputState>): OctaneNode {
  const field = useFieldControl()
  const input = usePrimitive(
    inputPrimitive,
    defined({
      value,
      defaultValue,
      onValueChange,
      controller,
      debug,
    })
  )
  const element = defined({
    ...elementProps(props, field, value, defaultValue),
    render: controlRender(field, "input", render),
  })
  return usePart(
    input,
    "root",
    defined(controlProps(props, field)),
    element,
    "input"
  )
}

const parts = createParts(inputGroup, { clear: "button" })

/**
 * Holds an Input or Textarea with icons, text and buttons around it. Presses
 * on its text and icons focus the field.
 */
function InputGroup({
  debug,
  ...props
}: InputGroupOptions & PartProps<"div", InputGroupState>): OctaneNode {
  return usePart(
    usePrimitive(inputGroup, defined({ debug })),
    "group",
    {},
    props,
    "div"
  )
}

/**
 * Empties the field in its group and focuses it. Shown while there's text to clear.
 */
const InputClear = parts.Clear

export { createInputController } from "@ui-sdk/core/input"
export type {
  InputController,
  InputGroupOptions,
  InputGroupPrimitive,
  InputGroupState,
  InputOptions,
  InputPrimitive,
  InputProps,
  InputState,
  InputValueChangeReason,
  TextareaOptions,
  TextareaPrimitive,
  TextareaProps,
  TextareaState,
  TextareaSubmitDetails,
} from "@ui-sdk/core/input"

export { Input, InputClear, InputGroup }
