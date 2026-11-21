/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
} from "../../src/components/color-picker"
import { SubmitForm } from "./form"

export function ColorPickerPage() {
  const [color, setColor] = useState("#3366ff")
  return (
    <main id="page-color-picker">
      <SubmitForm id="cp-form">
        <ColorPicker id="cp" name="brand" defaultValue="#ff0000" aria-label="Brand color">
          <ColorPickerArea id="cp-area" style={{ position: "relative", width: "200px", height: "100px" }}>
            <ColorPickerAreaThumb id="cp-area-thumb" />
          </ColorPickerArea>
          <ColorPickerSlider id="cp-hue" channel="hue" style={{ position: "relative", width: "200px", height: "12px" }}>
            <ColorPickerSliderThumb />
          </ColorPickerSlider>
          <ColorPickerSwatch id="cp-swatch" />
          <ColorPickerInput id="cp-input" aria-label="Hex" />
          <ColorPickerChannelInput id="cp-sat" channel="saturation" />
          <ColorPickerEyeDropper id="cp-dropper">Pick</ColorPickerEyeDropper>
          <ColorPickerSwatches id="cp-presets" aria-label="Presets">
            <ColorPickerSwatchItem value="#00ff00" />
            <ColorPickerSwatchItem value="#0000ff" />
          </ColorPickerSwatches>
        </ColorPicker>
      </SubmitForm>
      <ColorPicker id="ccp" aria-label="Accent" value={color} onValueChange={(next) => setColor(next)}>
        <ColorPickerInput id="ccp-input" aria-label="Accent hex" />
      </ColorPicker>
      <output id="ccp-value">{color}</output>
      <button id="ccp-outside" type="button" onClick={() => setColor("#000000")}>
        Black
      </button>
      <Field name="tint">
        <FieldLabel id="fcp-label">Tint</FieldLabel>
        <ColorPicker id="fcp" defaultValue="#ffffff">
          <ColorPickerSwatch />
        </ColorPicker>
      </Field>
    </main>
  )
}
