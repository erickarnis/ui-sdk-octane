/** @jsxImportSource octane */
// Ported from @ui-sdk/react's field (Apache-2.0, 0.1.0-beta.13). Each part
// inside a field is its own small component here, where upstream has one
// generic `InField`, and what a description describes is a tagged union, so
// nothing is asserted about which primitive a handle belongs to.
import {
  fieldGroup,
  field as fieldPrimitive,
  fieldSet,
  type FieldDescriptionState,
  type FieldErrorProps,
  type FieldErrorState,
  type FieldOptions,
  type FieldSetOptions,
  type FieldSetState,
  type FieldState,
} from "@ui-sdk/core/field"
import * as core from "@ui-sdk/core/renderer"
import type { FieldOutsideSlot } from "@ui-sdk/core/renderer"
import {
  createContext,
  useContext,
  useId,
  useMemo,
  type OctaneNode,
} from "octane"
import { extendHandle } from "../internal.js"
import {
  mergeProps,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
  type RenderProp,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { FieldContext, ownDescription } from "./field-context.js"
import { defined } from "./octane.js"

type FieldHandle = PrimitiveHandle<typeof fieldPrimitive>
type FieldSetHandle = PrimitiveHandle<typeof fieldSet>

// What a FieldDescription describes: the nearest Field, or a FieldSet when no
// Field is closer.
type Described =
  | { by: "field"; handle: FieldHandle }
  | { by: "set"; handle: FieldSetHandle }
const DescribedContext = createContext<Described | null>(null)

// Checks a part outside a field once it's in the page. Made once, so Octane
// keeps the same ref and hands the element over once.
const outsideRefs: Partial<
  Record<FieldOutsideSlot, (el: Element | null) => void>
> = {
  label: (el) => {
    core.checkFieldOutside(
      el,
      "label",
      "Put the control inside it, or point its `htmlFor` at the control."
    )
  },
  control: (el) => {
    core.checkFieldOutside(el, "control")
  },
}

// A part outside any Field: a plain element with no field wiring, so a
// FieldLabel is a native <label> that labels the control it wraps.
function outside(
  slot: FieldOutsideSlot,
  tag: string,
  {
    render,
    ...props
  }: Props & { render?: RenderProp<FieldErrorState> | undefined }
) {
  const ref = outsideRefs[slot]
  return renderElement(
    tag,
    mergeProps(core.fieldOutsideAttrs(slot), props, { ref }),
    render,
    core.fieldOutsideState
  )
}

/**
 * Ties a form control to its label, description and error messages.
 */
function Field({
  name,
  disabled,
  invalid,
  debug,
  ...props
}: FieldOptions & PartProps<"div", FieldState>): OctaneNode {
  const field = usePrimitive(
    fieldPrimitive,
    defined({ name, disabled, invalid, debug })
  )
  const context = useMemo(() => extendHandle(field, { name, disabled }))
  const described = useMemo((): Described => ({ by: "field", handle: field }))
  const root = usePart(field, "root", {}, props, "div")
  return (
    <FieldContext value={context}>
      <DescribedContext value={described}>{root}</DescribedContext>
    </FieldContext>
  )
}

// Field parts take the app's `id`, which names the part, as the slot's too.
// A part inside its field is a component of its own, as upstream's, so a
// field arriving around a part mounts it afresh.

function LabelInField({
  field,
  props,
}: {
  field: FieldHandle
  props: PartProps<"label", FieldState>
}) {
  return usePart(field, "label", defined({ id: props.id }), props, "label")
}

/**
 * The field's label, which names its control. Outside a Field it's a plain
 * <label>, which labels the control inside it, like a card around a whole Field.
 */
function FieldLabel(props: PartProps<"label", FieldState>): OctaneNode {
  const field = useContext(FieldContext)
  if (!field) return outside("label", "label", props)
  return <LabelInField field={field} props={props} />
}

function DescriptionInField({
  described,
  props,
}: {
  described: Described
  props: PartProps<"p", FieldDescriptionState>
}) {
  const part = defined({ id: props.id, value: useId() })
  // A field set's description slot takes the same props, and its state is the
  // `disabled` that FieldDescriptionState always has.
  return described.by === "field"
    ? usePart(described.handle, "description", part, props, "p")
    : usePart(described.handle, "description", part, props, "p")
}

/**
 * Describes its Field. Right inside a FieldSet, outside any Field, it describes
 * the group, so screen readers say it as focus enters the group.
 */
function FieldDescription(
  props: PartProps<"p", FieldDescriptionState>
): OctaneNode {
  const described = useContext(DescribedContext)
  if (!described) return outside("description", "p", props)
  return <DescriptionInField described={described} props={props} />
}

function ErrorInField({
  field,
  match,
  props,
}: {
  field: FieldHandle
  match: FieldErrorProps["match"]
  props: PartProps<"div", FieldErrorState>
}) {
  // Each error is its own part, keyed by a made value. Core gives the first one
  // that shows the id the control points at before the field binds.
  const part = defined({ id: props.id, value: useId(), match })
  return usePart(field, "error", part, props, "div")
}

/**
 * Shows while the field shows as invalid. Without children, it shows the
 * browser's message for the current problem.
 */
function FieldError({
  match,
  children = message,
  ...props
}: PartProps<"div", FieldErrorState> & FieldErrorProps): OctaneNode {
  const field = useContext(FieldContext)
  if (!field) {
    return core.fieldOutsideErrorShown(defined({ match }))
      ? outside("error", "div", { ...props, children })
      : null
  }
  return <ErrorInField field={field} match={match} props={{ ...props, children }} />
}

const message = (state: FieldErrorState) => state.message

function ControlInField({
  field,
  name,
  render,
  rest,
}: {
  field: FieldHandle & { name?: string | undefined }
  name: PartProps<"input", FieldState>["name"]
  render: RenderProp<FieldState> | undefined
  rest: Props
}) {
  const [props, element] = ownDescription(rest, render)
  const { id, "aria-describedby": describedBy } = props
  const control = {
    ...(typeof id === "string" && { id }),
    ...(typeof describedBy === "string" && { describedBy }),
  }
  const user = defined({ ...props, render: element, name: name ?? field.name })
  return usePart(field, "control", control, user, "input")
}

/**
 * A native control: an <input> by default, or anything through `render`.
 */
function FieldControl({
  name,
  render,
  ...rest
}: PartProps<"input", FieldState>): OctaneNode {
  const field = useContext(FieldContext)
  if (!field) return outside("control", "input", { ...rest, name, render })
  return <ControlInField field={field} name={name} render={render} rest={rest} />
}

/**
 * A native <fieldset>, so `disabled` disables every control inside it.
 */
function FieldSet({
  disabled,
  debug,
  ...props
}: FieldSetOptions &
  Omit<PartProps<"fieldset", FieldSetState>, "disabled">): OctaneNode {
  const set = usePrimitive(fieldSet, defined({ disabled, debug }))
  const described = useMemo((): Described => ({ by: "set", handle: set }))
  const root = usePart(set, "set", {}, props, "fieldset")
  return <DescribedContext value={described}>{root}</DescribedContext>
}

/**
 * Names the field set. Keep it the set's first child, where a <legend> names it natively.
 */
function FieldLegend(props: PartProps<"legend", FieldSetState>): OctaneNode {
  return usePart(fieldSet, "legend", defined({ id: props.id }), props, "legend")
}

/**
 * Lays fields out. It has no role: a FieldSet is what names and disables a group.
 */
function FieldGroup(props: PartProps<"div">): OctaneNode {
  return usePart(usePrimitive(fieldGroup, {}), "group", {}, props, "div")
}

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
}
export type {
  FieldApi,
  FieldDescriptionState,
  FieldErrorProps,
  FieldErrorState,
  FieldGroupPrimitive,
  FieldOptions,
  FieldPrimitive,
  FieldSetOptions,
  FieldSetPrimitive,
  FieldSetState,
  FieldState,
  ValidityKey,
} from "@ui-sdk/core/field"
export { useFieldControl } from "./field-context.js"
