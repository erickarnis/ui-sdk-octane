/** @jsxImportSource octane */
// Ported from @ui-sdk/react's checkbox (Apache-2.0, 0.1.0-beta.13). The
// group's type parameter is left out, as in this adapter's parts.
import {
  checkbox,
  checkboxGroup,
  type CheckboxGroupOptions,
  type CheckboxGroupState,
  type CheckboxOptions,
  type CheckboxState,
} from "@ui-sdk/core/checkbox"
import {
  createContext,
  createElement,
  useContext,
  type OctaneNode,
} from "octane"
import { reading } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import {
  controlRender,
  useFieldControl,
  type ButtonControlProps,
} from "./field-context.js"
import { defined } from "./octane.js"

const parts = createParts(checkbox, { root: "button", indicator: "span" })

// The group's own context, so a checkbox can join a group without bundling it.
const CheckboxGroupContext = createContext<PrimitiveHandle<
  typeof checkboxGroup
> | null>(null)

// The hidden native inputs that take part in the form.
function CheckboxInput() {
  return usePart(checkbox, "input", {}, {}, "input")
}

function GroupInput() {
  return usePart(checkboxGroup, "group-input", {}, {}, "input")
}

/**
 * The control and the hidden native input that takes part in the form.
 */
function Checkbox({
  disabled,
  name,
  render,
  ...props
}: Omit<CheckboxOptions, "group"> &
  ButtonControlProps<CheckboxState>): OctaneNode {
  const group = useContext(CheckboxGroupContext)
  // Inside a group, the group is the field's control.
  const field = useFieldControl()
  const fieldControl = group ? null : field
  return createElement(
    parts.Root,
    defined({
      ...props,
      disabled: disabled || fieldControl?.disabled,
      name: name ?? fieldControl?.name,
      group: group ? reading(group, () => group.api) : undefined,
      render: controlRender(
        fieldControl,
        "button",
        render,
        createElement(CheckboxInput)
      ),
    })
  )
}

/**
 * The check inside the checkbox. Rendered while it's checked or indeterminate, or always with `keepMounted`.
 */
const CheckboxIndicator = parts.Indicator

/**
 * Checkboxes that share a name and a list of checked values. The group, not
 * each checkbox, sits in a field.
 */
function CheckboxGroup({
  value,
  defaultValue,
  onValueChange,
  allValues,
  readOnly,
  disabled,
  required,
  name,
  form,
  controller,
  debug,
  render,
  ...props
}: CheckboxGroupOptions &
  Omit<
    PartProps<"div", CheckboxGroupState>,
    "defaultValue" | "onChange" | "onSelect"
  >) {
  const field = useFieldControl()
  const group = usePrimitive(
    checkboxGroup,
    defined({
      value,
      defaultValue,
      onValueChange,
      allValues,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      controller,
      debug,
    })
  )
  return createElement(
    CheckboxGroupContext,
    { value: group },
    usePart(
      group,
      "group",
      {},
      defined({
        ...props,
        render: controlRender(field, "div", render, createElement(GroupInput)),
      }),
      "div"
    )
  )
}

export {
  createCheckboxController,
  createCheckboxGroupController,
} from "@ui-sdk/core/checkbox"
export type {
  CheckboxApi,
  CheckboxChangeOptions,
  CheckboxCheckedChangeReason,
  CheckboxController,
  CheckboxGroupApi,
  CheckboxGroupChangeOptions,
  CheckboxGroupController,
  CheckboxGroupOptions,
  CheckboxGroupPrimitive,
  CheckboxGroupState,
  CheckboxGroupValueChangeReason,
  CheckboxIndicatorProps,
  CheckboxIndicatorState,
  CheckboxOptions,
  CheckboxPrimitive,
  CheckboxState,
  CheckedState,
} from "@ui-sdk/core/checkbox"

export { Checkbox, CheckboxGroup, CheckboxIndicator }
