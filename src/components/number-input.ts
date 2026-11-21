/** @jsxImportSource octane */
// Ported from @ui-sdk/react's number-input (Apache-2.0, 0.1.0-beta.13).
import type { Primitive } from "@ui-sdk/core"
import {
  numberInput as numberInputPrimitive,
  type NumberInputOptions,
  type NumberInputScrubAreaProps,
  type NumberInputState,
} from "@ui-sdk/core/number-input"
import {
  createContext,
  createElement,
  createPortal,
  Fragment,
  useContext,
  useMemo,
  type OctaneNode,
} from "octane"
import { extendHandle } from "../internal.js"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { useControllerEntry, useControllerTarget } from "./controller-target.js"
import {
  ownDescription,
  useFieldControl,
  useFieldControlId,
} from "./field-context.js"
import { contentOf, defined } from "./octane.js"

const parts = createParts(numberInputPrimitive, {
  group: "div",
  increment: "button",
  decrement: "button",
})

type NumberInputContextValue = PrimitiveHandle<typeof numberInputPrimitive> & {
  field: ReturnType<typeof useFieldControl>
}

const NumberInputContext = createContext<NumberInputContextValue | null>(null)

// A handle a controller found is a number input's context when its primitive
// is this one: only `NumberInput` registers one, and it registers its context.
const isNumberInput = (
  handle: PrimitiveHandle<Primitive> | undefined
): handle is NumberInputContextValue =>
  !!handle && handle.primitive === numberInputPrimitive && "field" in handle

function useNumberInput(part: string) {
  const context = useContext(NumberInputContext)
  if (!context) {
    throw new Error(`${part} must be used inside <NumberInput>.`)
  }
  return context
}

type DivProps = Omit<
  PartProps<"div", NumberInputState>,
  "defaultValue" | "onChange" | "onSelect"
>

/**
 * The root, and the hidden input that submits the number as is.
 */
function NumberInput({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  largeStep,
  smallStep,
  format,
  locale,
  wheel,
  disabled,
  readOnly,
  required,
  name,
  form,
  controller,
  debug,
  children,
  ...props
}: NumberInputOptions & DivProps): OctaneNode {
  const field = useFieldControl()
  const controlId = useFieldControlId()
  const numberInput = usePrimitive(
    numberInputPrimitive,
    defined({
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      min,
      max,
      step,
      largeStep,
      smallStep,
      format,
      locale,
      wheel,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      controller,
      debug,
      controlId,
    })
  )
  const context = useMemo(
    () => extendHandle(numberInput, { field }),
    [numberInput, field]
  )
  useControllerEntry(controller, context)
  const content = (current: NumberInputState) =>
    createElement(
      Fragment,
      null,
      contentOf(children, current),
      createElement(HiddenInput)
    )
  // A context is its own provider in Octane.
  return createElement(
    NumberInputContext,
    { value: context },
    usePart(numberInput, "root", {}, { ...props, children: content })
  )
}

// The hidden input that submits the number as is.
function HiddenInput() {
  return usePart(numberInputPrimitive, "hidden-input", {}, {}, "input")
}

/**
 * Holds the input and its buttons.
 */
const NumberInputGroup = parts.Group

/**
 * The text field, which shows the formatted number and takes typing.
 */
function NumberInputControl({
  render,
  ...props
}: Omit<
  PartProps<"input", NumberInputState>,
  "value" | "defaultValue" | "children" | "readOnly"
>): OctaneNode {
  const numberInput = useNumberInput("NumberInputControl")
  // The core writes the text as it changes, so Octane only renders where it starts.
  const control = (input: Props, state: NumberInputState) => {
    const { field } = numberInput
    const [own, element] = field
      ? ownDescription(input, render)
      : [input, render]
    const merged: Props = field ? field.props(own) : own
    const { value, ...rest } = merged
    return renderElement(
      "input",
      { ...rest, defaultValue: value },
      element,
      state
    )
  }
  return usePart(
    numberInput,
    "control",
    {},
    { ...props, render: control },
    "input"
  )
}

/**
 * Steps up once, then repeats while held. Shift steps by `largeStep`.
 */
const NumberInputIncrement = parts.Increment

/**
 * Steps down once, then repeats while held. Shift steps by `largeStep`.
 */
const NumberInputDecrement = parts.Decrement

// What a scrub area outside its number input renders with until that mounts.
const unconnected: NumberInputState = {
  value: null,
  disabled: false,
  readOnly: false,
  required: false,
  scrubbing: false,
}

/**
 * Drag across it to change the value. It works anywhere inside the number
 * input, and outside it through `controller`, like an icon in a toolbar.
 */
function NumberInputScrubArea({
  orientation,
  pixelsPerStep,
  controller,
  render,
  ...props
}: PartProps<"span", NumberInputState> &
  NumberInputScrubAreaProps): OctaneNode {
  const found = useControllerTarget(
    controller,
    useContext(NumberInputContext) ?? undefined
  )
  const numberInput = isNumberInput(found) ? found : undefined
  // Until the number input it names mounts, a scrub area outside it is a plain span.
  if (!numberInput) {
    return renderElement("span", props, render, unconnected)
  }
  return createElement(
    NumberInputContext,
    { value: numberInput },
    createElement(ScrubAreaPart, {
      numberInput,
      scrub: defined({ orientation, pixelsPerStep }),
      props,
      render,
    })
  )
}

function ScrubAreaPart({
  numberInput,
  scrub,
  props,
  render,
}: {
  numberInput: NumberInputContextValue
  scrub: Omit<NumberInputScrubAreaProps, "controller">
  props: Props
  render?: PartProps<"span", NumberInputState>["render"]
}) {
  return usePart(numberInput, "scrub-area", scrub, { ...props, render }, "span")
}

/**
 * Stands in for the mouse cursor while a scrub locks the pointer. Rendered in
 * the body, so transformed ancestors can't move it.
 */
function NumberInputScrubAreaCursor(
  props: PartProps<"span", NumberInputState>
): OctaneNode {
  const numberInput = useContext(NumberInputContext)
  // A scrub area outside its number input renders before that mounts, with no cursor yet.
  return numberInput
    ? createElement(CursorPart, { ...props, numberInput })
    : null
}

function CursorPart({
  numberInput,
  ...props
}: PartProps<"span", NumberInputState> & {
  numberInput: NumberInputContextValue
}) {
  const cursor = usePart(numberInput, "scrub-area-cursor", {}, props, "span")
  return cursor && createPortal(cursor, document.body)
}

export { createNumberInputController } from "@ui-sdk/core/number-input"
export type {
  NumberInputApi,
  NumberInputButtonProps,
  NumberInputButtonState,
  NumberInputChangeOptions,
  NumberInputController,
  NumberInputOptions,
  NumberInputPrimitive,
  NumberInputScrubAreaProps,
  NumberInputState,
  NumberInputValueChangeReason,
} from "@ui-sdk/core/number-input"

export {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
  NumberInputScrubAreaCursor,
}
