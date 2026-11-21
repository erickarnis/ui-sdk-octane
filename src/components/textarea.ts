/** @jsxImportSource octane */
// Ported from @ui-sdk/react's textarea (Apache-2.0, 0.1.0-beta.13).
import type { OctaneNode } from "octane"
import {
  textarea as textareaPrimitive,
  type TextareaOptions,
  type TextareaState,
} from "@ui-sdk/core/input"
import { controlRender, useFieldControl } from "./field-context.js"
import { controlProps, elementProps, type Native } from "./text-control.js"
import { usePart, usePrimitive } from "../primitive.js"
import { defined } from "./octane.js"

/**
 * A native <textarea>, wired to the Field it's in, that can grow with its text.
 */
function Textarea({
  value,
  defaultValue,
  onValueChange,
  controller,
  debug,
  autoResize,
  onSubmit,
  submitShortcut,
  render,
  ...props
}: TextareaOptions &
  Omit<Native<"textarea", TextareaState>, "onSubmit">): OctaneNode {
  const field = useFieldControl()
  const textarea = usePrimitive(
    textareaPrimitive,
    defined({
      value,
      defaultValue,
      onValueChange,
      controller,
      debug,
      autoResize,
      onSubmit,
      submitShortcut,
    })
  )
  const element = defined({
    ...elementProps(props, field, value, defaultValue),
    render: controlRender(field, "textarea", render),
  })
  return usePart(
    textarea,
    "root",
    defined(controlProps(props, field)),
    element,
    "textarea"
  )
}

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

export { Textarea }
