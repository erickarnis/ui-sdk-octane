// What a text field's component shares, ported from @ui-sdk/react's
// text-control (Apache-2.0, 0.1.0-beta.13).
import type { PartProps } from "../primitive.js"
import type { useFieldControl } from "./field-context.js"

// Props an input or textarea takes that the part replaces.
type Native<Tag extends "input" | "textarea", State> = Omit<
  PartProps<Tag, State>,
  "value" | "defaultValue" | "onSelect"
>

// Octane warns about a `value` without `onInput`, as React does without
// `onChange`. `onValueChange` is the change handler here.
const ignore = () => {}

// The native props a text field's state follows, and its input handler.
type TextProps = {
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  onInput?: unknown
}

// The states a text field's attributes follow, from its own props and its field's.
function controlProps(
  props: TextProps,
  field: ReturnType<typeof useFieldControl>
) {
  return {
    disabled: props.disabled || field?.disabled,
    readOnly: props.readOnly,
    required: props.required,
  }
}

// The element's props: the field's name, the user's props, and the value left
// to Octane, so it stays a native controlled or uncontrolled input.
function elementProps<Props extends TextProps>(
  props: Props,
  field: ReturnType<typeof useFieldControl>,
  value?: string,
  defaultValue?: string
) {
  return {
    name: field?.name,
    ...props,
    value,
    defaultValue,
    onInput: props.onInput ?? (value === undefined ? undefined : ignore),
  }
}

export { controlProps, elementProps, type Native }
