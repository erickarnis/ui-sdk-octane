/** @jsxImportSource octane */
// Ported from @ui-sdk/react's password-input (Apache-2.0, 0.1.0-beta.13).
import {
  passwordInput,
  type PasswordInputOptions,
  type PasswordInputState,
} from "@ui-sdk/core/password-input"
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type OctaneNode,
} from "octane"
import { createParts, usePart, type PartProps } from "../primitive.js"
import {
  controlRender,
  useFieldControl,
  useFieldControlId,
} from "./field-context.js"
import { defined } from "./octane.js"

const parts = createParts(passwordInput, { root: "div", toggle: "button" })

// What the control renders from the root: its field, and the value Octane keeps.
type ControlContextValue = {
  field: ReturnType<typeof useFieldControl>
  value?: string | undefined
  defaultValue?: string | undefined
}

const ControlContext = createContext<ControlContextValue>({ field: null })

// Octane warns about a `value` without `onInput`. `onValueChange` is the change handler here.
const ignore = () => {}

/**
 * Holds the field and its toggle. Presses on its own text and icons focus the field.
 */
function PasswordInput({
  value,
  defaultValue,
  name,
  disabled,
  ...props
}: PasswordInputOptions &
  Omit<
    PartProps<"div", PasswordInputState>,
    "defaultValue" | "onChange" | "onSelect"
  >): OctaneNode {
  const field = useFieldControl()
  const controlId = useFieldControlId()
  const control = useMemo(
    () => ({ field, value, defaultValue }),
    [field, value, defaultValue]
  )
  // A context is its own provider in Octane.
  return createElement(
    ControlContext,
    { value: control },
    createElement(
      parts.Root,
      defined({
        ...props,
        value,
        defaultValue,
        name: name ?? field?.name,
        disabled: disabled || field?.disabled,
        controlId,
      })
    )
  )
}

/**
 * The native <input>. Its type follows whether the password is shown, and
 * form attributes come from <PasswordInput>.
 */
function PasswordInputControl({
  id,
  render,
  ...props
}: Omit<
  PartProps<"input", PasswordInputState>,
  | "value"
  | "defaultValue"
  | "children"
  | "type"
  | "name"
  | "form"
  | "required"
  | "disabled"
  | "readOnly"
  | "autoComplete"
  | "onSelect"
>): OctaneNode {
  const { field, value, defaultValue } = useContext(ControlContext)
  // The value stays Octane's, so the field is a native controlled or uncontrolled input.
  const element = defined({
    ...props,
    value,
    defaultValue,
    onInput: props.onInput ?? (value === undefined ? undefined : ignore),
    render: controlRender(field, "input", render),
  })
  return usePart(passwordInput, "control", defined({ id }), element, "input")
}

/**
 * Shows and hides the password. Name it by what it does, like "Show password":
 * it's a toggle button, and `aria-pressed` says whether the password is shown.
 */
const PasswordInputToggle = parts.Toggle

export { createPasswordInputController } from "@ui-sdk/core/password-input"
export type {
  InputValueChangeReason,
  PasswordInputController,
  PasswordInputOptions,
  PasswordInputPrimitive,
  PasswordInputState,
  PasswordInputVisibleChangeReason,
} from "@ui-sdk/core/password-input"

export { PasswordInput, PasswordInputControl, PasswordInputToggle }
