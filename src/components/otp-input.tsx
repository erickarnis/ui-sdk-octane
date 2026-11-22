/** @jsxImportSource octane */
// Ported from @ui-sdk/react's otp-input (Apache-2.0, 0.1.0-beta.13).
import {
  otpInput,
  type OTPInputOptions,
  type OTPInputSlotProps,
  type OTPInputSlotState,
  type OTPInputState,
} from "@ui-sdk/core/otp-input"
import {
  useState,
  type ComponentProps,
  type OctaneNode,
} from "octane"
import { slotIn, useHandle } from "../internal.js"
import { createParts, usePart, type PartProps } from "../primitive.js"
import type { Props } from "../render-element.js"
import { useFieldControl } from "./field-context.js"
import { contentOf, defined } from "./octane.js"

const parts = createParts(otpInput, {
  root: "div",
  group: "div",
  separator: "div",
})

type DivProps<State> = Omit<
  PartProps<"div", State>,
  "defaultValue" | "onChange" | "onSelect"
>

// Props that belong to the input, which is what takes focus and is named.
type InputProps = Pick<
  ComponentProps<"input">,
  | "id"
  | "autoFocus"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "aria-invalid"
>

// Content, then the input after it, with function children resolved.
function withInput<State>(
  children: DivProps<State>["children"],
  input: OctaneNode
) {
  return (state: State) => {
    // Read now: JSX reads its children only when Octane renders the element.
    const content = contentOf(children, state)
    return (
      <>
        {content}
        {input}
      </>
    )
  }
}

// The one real input, over the slots.
function OTPInputControl(props: InputProps) {
  const otp = useHandle(otpInput)
  const field = useFieldControl()
  // The core writes the input's value, so Octane only renders where it starts.
  const [initial] = useState(() => {
    const value: unknown = slotIn(otp, "control").value
    return typeof value === "string" ? value : undefined
  })
  const render = (control: Props) => {
    const merged: Props = field ? field.props(control) : control
    const { value: _, ...input } = merged
    return <input {...defined({ ...input, defaultValue: initial })} />
  }
  return usePart(otp, "control", {}, { ...defined(props), render }, "input")
}

/**
 * The root: the slots, and the one real input over them. `id`, `autoFocus`
 * and the `aria-*` naming props go to that input.
 */
function OTPInput({
  disabled,
  name,
  id,
  autoFocus,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  children,
  ...props
}: OTPInputOptions & InputProps & DivProps<OTPInputState>): OctaneNode {
  const field = useFieldControl()
  const input = (
    <OTPInputControl
      {...defined({
        id,
        autoFocus,
        "aria-label": label,
        "aria-labelledby": labelledBy,
        "aria-describedby": describedBy,
        "aria-invalid": invalid,
      })}
    />
  )
  return (
    <parts.Root
      {...defined({
        ...props,
        disabled: disabled || field?.disabled,
        name: name ?? field?.name,
        children: withInput(children, input),
      })}
    />
  )
}

/**
 * Lays out a run of slots.
 */
const OTPInputGroup = parts.Group

const char = (state: OTPInputSlotState) => state.char

/**
 * One character of the code. Without children, it shows the character.
 */
function OTPInputSlot({
  index,
  children = char,
  ...props
}: OTPInputSlotProps & DivProps<OTPInputSlotState>): OctaneNode {
  // Slots are told apart by their index.
  return usePart(
    otpInput,
    "slot",
    { index, id: String(index) },
    { ...props, children }
  )
}

/**
 * Drawn between groups, like a dash.
 */
const OTPInputSeparator = parts.Separator

export { createOTPInputController } from "@ui-sdk/core/otp-input"
export type {
  OTPInputApi,
  OTPInputChangeOptions,
  OTPInputController,
  OTPInputOptions,
  OTPInputPattern,
  OTPInputSlotData,
  OTPInputSlotProps,
  OTPInputSlotState,
  OTPInputState,
  OTPInputValueChangeReason,
  OtpInputPrimitive,
} from "@ui-sdk/core/otp-input"

export { OTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot }
