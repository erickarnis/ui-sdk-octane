/** @jsxImportSource octane */
// Ported from @ui-sdk/react's switch (Apache-2.0, 0.1.0-beta.13).
import {
  switchPrimitive,
  type SwitchOptions,
  type SwitchState,
} from "@ui-sdk/core/switch"
import { createElement, type OctaneNode } from "octane"
import { createParts, usePart } from "../primitive.js"
import {
  controlRender,
  useFieldControl,
  type ButtonControlProps,
} from "./field-context.js"
import { defined } from "./octane.js"

const parts = createParts(switchPrimitive, { root: "button", thumb: "span" })

// The hidden native input that takes part in the form.
function SwitchInput() {
  return usePart(switchPrimitive, "input", {}, {}, "input")
}

/**
 * A control that turns a setting on or off, with the hidden native input that takes part in the form.
 */
function Switch({
  disabled,
  name,
  render,
  ...props
}: SwitchOptions & ButtonControlProps<SwitchState>): OctaneNode {
  const field = useFieldControl()
  return createElement(
    parts.Root,
    defined({
      ...props,
      disabled: disabled || field?.disabled,
      name: name ?? field?.name,
      render: controlRender(
        field,
        "button",
        render,
        createElement(SwitchInput)
      ),
    })
  )
}

/**
 * The thumb that slides along the switch as it turns on or off.
 */
const SwitchThumb = parts.Thumb

export { createSwitchController } from "@ui-sdk/core/switch"
export type {
  SwitchApi,
  SwitchCheckedChangeReason,
  SwitchController,
  SwitchOptions,
  SwitchPrimitive,
  SwitchState,
  SwitchThumbState,
} from "@ui-sdk/core/switch"

export { Switch, SwitchThumb }
