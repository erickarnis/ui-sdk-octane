/** @jsxImportSource octane */
// Ported from @ui-sdk/react's slider (Apache-2.0, 0.1.0-beta.13).
import {
  slider as sliderPrimitive,
  type SliderOptions,
  type SliderState,
  type SliderThumbProps,
  type SliderThumbState,
  type SliderValueState,
} from "@ui-sdk/core/slider"
import {
  createContext,
  createElement,
  Fragment,
  useContext,
  useMemo,
  type ComponentProps,
  type OctaneNode,
} from "octane"
import { extendHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import {
  controlRender,
  useFieldControl,
  useFieldControlId,
} from "./field-context.js"
import { contentOf, defined } from "./octane.js"

const parts = createParts(sliderPrimitive, {
  control: "div",
  track: "div",
  indicator: "div",
  value: "output",
})

type SliderContextValue = PrimitiveHandle<typeof sliderPrimitive> & {
  // The field a single thumb's input joins. A range joins it on the root instead.
  field: ReturnType<typeof useFieldControl>
}

const SliderContext = createContext<SliderContextValue | null>(null)

function useSlider(part: string) {
  const context = useContext(SliderContext)
  if (!context) {
    throw new Error(`${part} must be used inside <Slider>.`)
  }
  return context
}

type DivProps<State> = Omit<
  PartProps<"div", State>,
  "defaultValue" | "onChange" | "onSelect"
>

// Content, then what the part adds after it, with function children resolved.
function withAfter<State>(
  children: DivProps<State>["children"],
  after: OctaneNode
) {
  return (state: State) =>
    createElement(Fragment, null, contentOf(children, state), after)
}

/**
 * The root: a group around the thumbs, and the hidden input the form submits.
 */
function Slider<Value extends number | number[] = number | number[]>({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  largeStep,
  minStepsBetweenThumbs,
  orientation,
  disabled,
  readOnly,
  required,
  name,
  form,
  format,
  locale,
  controller,
  debug,
  render,
  children,
  ...props
}: SliderOptions<Value> & DivProps<SliderState>): OctaneNode {
  const field = useFieldControl()
  const controlId = useFieldControlId()
  const slider = usePrimitive(
    sliderPrimitive,
    defined({
      value,
      defaultValue,
      // SAFETY: `Value` is the shape of `value` or `defaultValue`, which the
      // instance keeps: it reports a number for a number and an array for an
      // array, so a handler of `Value` is one of what it reports.
      onValueChange: onValueChange as SliderOptions["onValueChange"],
      // SAFETY: as for `onValueChange`.
      onValueCommit: onValueCommit as SliderOptions["onValueCommit"],
      min,
      max,
      step,
      largeStep,
      minStepsBetweenThumbs,
      orientation,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      format,
      locale,
      controller,
      debug,
      thumbInputId: controlId,
    })
  )
  // A range is a group the field's label names. A single thumb is the control itself.
  const shape = value ?? defaultValue
  const range = Array.isArray(shape) && shape.length > 1
  const context = useMemo(
    () => extendHandle(slider, { field: range ? null : field }),
    [slider, range, field]
  )
  const root = defined({
    ...props,
    children: withAfter(children, createElement(HiddenInput)),
    render: controlRender(range ? field : null, "div", render),
  })
  // A context is its own provider in Octane.
  return createElement(
    SliderContext,
    { value: context },
    usePart(slider, "root", {}, root)
  )
}

// The hidden input the form submits.
function HiddenInput() {
  return usePart(sliderPrimitive, "input", {}, {}, "input")
}

/**
 * Where presses land. A press on the track moves the nearest thumb there.
 */
const SliderControl = parts.Control

/**
 * The rail the thumbs move along. Positions are percentages of it.
 */
const SliderTrack = parts.Track

/**
 * The filled part of the track: up to a single thumb, or between a range's thumbs.
 */
const SliderIndicator = parts.Indicator

/**
 * A thumb, with the native range input that takes focus inside it. Its
 * `aria-label`, `aria-labelledby` and `aria-describedby` go to that input.
 */
function SliderThumb({
  index = 0,
  children,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: DivProps<SliderThumbState> & SliderThumbProps): OctaneNode {
  // Thumbs are told apart by their index.
  const thumb = { index, id: String(index) }
  const input = createElement(
    ThumbInput,
    defined({
      ...thumb,
      "aria-label": label,
      "aria-labelledby": labelledBy,
      "aria-describedby": describedBy,
    })
  )
  return usePart(sliderPrimitive, "thumb", thumb, {
    ...props,
    children: withAfter(children, input),
  })
}

// The native range input inside a thumb, which takes focus.
function ThumbInput({
  index,
  id,
  ...named
}: { index: number; id: string } & Pick<
  ComponentProps<"input">,
  "aria-label" | "aria-labelledby" | "aria-describedby"
>) {
  const { field } = useSlider("SliderThumb")
  // The core writes the input's value, so Octane only renders where it starts.
  const render = (input: Props) => {
    const merged: Props = field ? field.props(input) : input
    const { value, ...rest } = merged
    return createElement("input", { ...rest, defaultValue: value })
  }
  return usePart(
    sliderPrimitive,
    "thumb-input",
    { index, id },
    { ...named, render },
    "input"
  )
}

/**
 * The formatted value, a range joined with an en dash. Children replace it.
 */
function SliderValue({
  children = text,
  ...props
}: PartProps<"output", SliderValueState>): OctaneNode {
  return createElement(parts.Value, defined({ ...props, children }))
}

const text = (state: SliderValueState) => state.text

export { createSliderController } from "@ui-sdk/core/slider"
export type {
  NumberFormat,
  SliderApi,
  SliderChangeOptions,
  SliderController,
  SliderOptions,
  SliderPrimitive,
  SliderState,
  SliderThumbProps,
  SliderThumbState,
  SliderValueChangeDetails,
  SliderValueChangeReason,
  SliderValueCommitDetails,
  SliderValueState,
} from "@ui-sdk/core/slider"

export {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
}
