/** @jsxImportSource octane */
// Ported from @ui-sdk/react's color-picker (Apache-2.0, 0.1.0-beta.13).
import {
  colorPicker,
  type ColorPickerChannelInputProps,
  type ColorPickerOptions,
  type ColorPickerState,
} from "@ui-sdk/core/color-picker"
import { useId, type OctaneNode } from "octane"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { contentOf, defined } from "./octane.js"

const parts = createParts(colorPicker, {
  area: "div",
  "area-thumb": "div",
  "area-canvas": "canvas",
  slider: "div",
  "slider-thumb": "div",
  swatch: "div",
  "eye-dropper": "button",
  swatches: "div",
  "swatch-item": "button",
})

type DivProps<State> = Omit<
  PartProps<"div", State>,
  "defaultValue" | "onChange" | "onSelect"
>

type InputProps<State> = Omit<
  PartProps<"input", State>,
  "value" | "defaultValue" | "children" | "readOnly"
>

// The core writes an input's text as it changes, so Octane only renders where it starts.
function startsAt(render: InputProps<ColorPickerState>["render"]) {
  return (merged: Props, state: ColorPickerState) => {
    const { value, ...rest } = merged
    return renderElement(
      "input",
      { ...rest, defaultValue: value },
      render,
      state
    )
  }
}

/**
 * The root: a group around the picker's parts, and the hidden input the form submits.
 */
function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  space,
  format,
  gamut,
  disabled,
  readOnly,
  required,
  name,
  form,
  controller,
  debug,
  render,
  children,
  ...props
}: ColorPickerOptions & DivProps<ColorPickerState>): OctaneNode {
  const field = useFieldControl()
  const picker = usePrimitive(
    colorPicker,
    defined({
      value,
      defaultValue,
      onValueChange,
      onValueCommit,
      space,
      format,
      gamut,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      controller,
      debug,
    })
  )
  const root = defined({
    ...props,
    children: (state: ColorPickerState) => {
      // Read now: JSX reads its children only when Octane renders the element.
      const content = contentOf(children, state)
      return (
        <>
          {content}
          <HiddenInput />
        </>
      )
    },
    render: controlRender(field, "div", render),
  })
  return usePart(picker, "root", {}, root)
}

function HiddenInput() {
  return usePart(colorPicker, "hidden-input", {}, {}, "input")
}

/**
 * A surface for two channels, `x` and `y`. Its background comes from
 * `--color-area-background` where gradients draw it, or a `ColorPickerAreaCanvas`.
 */
const ColorPickerArea = parts.Area

/**
 * The area's thumb: a slider screen readers hear as both channels.
 */
const ColorPickerAreaThumb = parts.AreaThumb

/**
 * Paints the area pixel by pixel, for channels no gradient draws, like OKLCH's
 * chroma by lightness. Colors outside the gamut stay transparent.
 */
const ColorPickerAreaCanvas = parts.AreaCanvas

/**
 * A track for one `channel`, drawn by `--color-slider-background`.
 */
const ColorPickerSlider = parts.Slider

/**
 * The slider's thumb, at `--color-slider-thumb-position`.
 */
const ColorPickerSliderThumb = parts.SliderThumb

/**
 * A text input that reads any CSS color on Enter or blur. Text that isn't
 * one goes back to the value.
 */
function ColorPickerInput({
  render,
  ...props
}: InputProps<ColorPickerState>): OctaneNode {
  return usePart(
    colorPicker,
    "input",
    {},
    { ...props, render: startsAt(render) },
    "input"
  )
}

/**
 * A number input for one `channel`, in the units people read it in.
 */
function ColorPickerChannelInput({
  channel,
  render,
  ...props
}: InputProps<ColorPickerState> & ColorPickerChannelInputProps): OctaneNode {
  const id = useId()
  return usePart(
    colorPicker,
    "channel-input",
    defined({ id, channel }),
    { ...props, render: startsAt(render) },
    "input"
  )
}

/**
 * The color itself, as `--color-picker-color`, named for screen readers.
 */
const ColorPickerSwatch = parts.Swatch

/**
 * A button that picks a color from the screen, where the browser can.
 * Elsewhere it's disabled, with `data-unsupported`.
 */
const ColorPickerEyeDropper = parts.EyeDropper

/**
 * A list of preset colors. Arrow keys move between them.
 */
const ColorPickerSwatches = parts.Swatches

/**
 * A preset color, as `--color-picker-color`. Pressing it sets the value.
 */
const ColorPickerSwatchItem = parts.SwatchItem

export { createColorPickerController } from "@ui-sdk/core/color-picker"
export type {
  Color,
  ColorChannel,
  ColorFormat,
  ColorGamut,
  ColorPickerApi,
  ColorPickerAreaProps,
  ColorPickerChangeOptions,
  ColorPickerChannelInputProps,
  ColorPickerController,
  ColorPickerOptions,
  ColorPickerPrimitive,
  ColorPickerSliderProps,
  ColorPickerSliderState,
  ColorPickerSpace,
  ColorPickerState,
  ColorPickerSwatchItemProps,
  ColorPickerSwatchItemState,
  ColorPickerValueChangeDetails,
  ColorPickerValueChangeReason,
  ColorPickerValueCommitDetails,
} from "@ui-sdk/core/color-picker"

export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaCanvas,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
}
