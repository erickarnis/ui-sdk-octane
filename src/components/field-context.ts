/** @jsxImportSource octane */
// The field's context, apart from its parts, so a control can join a field
// without bundling the field. Ported from @ui-sdk/react's field-context.
import type { field } from "@ui-sdk/core/field"
import * as core from "@ui-sdk/core/renderer"
import {
  cloneElement,
  createContext,
  createElement,
  Fragment,
  isValidElement,
  useContext,
  useSyncExternalStore,
  type OctaneNode,
} from "octane"
import * as internal from "../internal.js"
import {
  renderElement,
  type PartProps,
  type PrimitiveHandle,
  type RenderProp,
} from "../primitive.js"
import { isProps, type Props } from "../render-element.js"

type FieldContextValue = PrimitiveHandle<typeof field> & {
  name?: string | undefined
  disabled?: boolean | undefined
}

const FieldContext = createContext<FieldContextValue | null>(null)

const noop = () => () => {}
const zero = () => 0

/**
 * Controls inside a field take its name and disabled state, and its ids and
 * validity through the field's control slot. Null outside a field. The control
 * re-renders when the field changes, like when its label or errors appear.
 * The control takes the field's id, so the label points at it from the
 * server's HTML on, unless its own props give one. A control whose component
 * makes the id it renders, like a select's trigger, passes those props as `own`.
 */
function useFieldControl(own?: { id?: string | undefined }) {
  return useJoinField(useContext(FieldContext), own)
}

// `useFieldControl` for one field, or null for none, for a control that joins
// only some of the fields around it, like a radio, which leaves its group's
// field to the group and doesn't re-render with it.
function useJoinField(
  field: FieldContextValue | null,
  own?: { id?: string | undefined }
) {
  const version = field ? () => core.renderVersion(field.instance) : zero
  useSyncExternalStore(
    field ? field.instance.subscribe : noop,
    version,
    version
  )
  if (!field) return null
  return {
    name: field.name,
    disabled: field.disabled,
    // Merges the field's attributes for its control into the control's props,
    // keeping the control's own description ahead of the field's. The field
    // decides the id.
    props: (props: Props) => {
      const label = props["aria-labelledby"]
      const id = (own ?? props).id
      const describedBy = props["aria-describedby"]
      const merged = internal.slotIn(
        field,
        "control",
        {
          ...(typeof id === "string" && { id }),
          ...(typeof describedBy === "string" && { describedBy }),
        },
        {
          ...props,
          id: undefined,
          "aria-labelledby": core.madeLabel(label) ? undefined : label,
        }
      )
      // The field's label names the control over the control's own, like a
      // ComboboxLabel's, but not over the author's. The control stays its own
      // part for styling.
      return {
        ...merged,
        "aria-labelledby": merged["aria-labelledby"] ?? label,
        "data-slot": props["data-slot"],
      }
    },
  }
}

type FieldControl = ReturnType<typeof useJoinField>

// A `render` element's own description would win the merge over the field's,
// so it moves into the props, where the field puts it ahead of its own.
function ownDescription<State extends object>(
  props: Props,
  render: RenderProp<State> | undefined
): readonly [Props, RenderProp<State> | undefined] {
  if (!isValidElement(render)) return [props, render]
  const given: unknown = render.props
  const own = isProps(given) ? given["aria-describedby"] : undefined
  if (own === undefined) return [props, render]
  const element = cloneElement(render, { "aria-describedby": undefined })
  return [{ ...props, "aria-describedby": own }, element]
}

/**
 * A control's `render`: its element, with the field's attributes for its
 * control merged in when it's in a field, and then `after`, like the hidden
 * native input of a checkbox.
 */
function controlRender<State extends object>(
  field: FieldControl,
  tag: string,
  render?: RenderProp<State>,
  after?: OctaneNode
): RenderProp<State> | undefined {
  if (!field && !after) return render
  return (props: Props, state: State) => {
    const [own, element] = field
      ? ownDescription(props, render)
      : [props, render]
    return createElement(
      Fragment,
      null,
      renderElement(tag, field ? field.props(own) : own, element, state),
      after
    )
  }
}

// Props a button takes that mean something else on a checkbox or a switch.
type ButtonControlProps<State extends object> = Omit<
  PartProps<"button", State>,
  | "value"
  | "name"
  | "form"
  | "defaultChecked"
  | "defaultValue"
  | "onChange"
  | "onSelect"
>

function useFieldControlId() {
  const field = useContext(FieldContext)
  return field ? core.fieldControlId(field.api.id) : undefined
}

export {
  type ButtonControlProps,
  controlRender,
  FieldContext,
  type FieldContextValue,
  ownDescription,
  useFieldControl,
  useFieldControlId,
  useJoinField,
}
