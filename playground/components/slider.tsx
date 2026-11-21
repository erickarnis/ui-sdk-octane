/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { Slider, SliderControl, SliderIndicator, SliderThumb, SliderTrack, SliderValue } from "../../src/components/slider"
import { SubmitForm } from "./form"

const track = { position: "relative", height: "8px", width: "200px", background: "#ddd" } as const
const thumbStyle = { position: "absolute", width: "12px", height: "12px", top: "-2px", background: "#333" } as const

export function SliderPage() {
  const [range, setRange] = useState([20, 60])
  const [committed, setCommitted] = useState("")
  return (
    <main id="page-slider">
      <SubmitForm id="sl-form">
        <Slider id="sl" name="volume" defaultValue={30}>
          <SliderValue id="sl-value" />
          <SliderControl id="sl-control" style={{ padding: "8px 0" }}>
            <SliderTrack style={track}>
              <SliderIndicator id="sl-indicator" />
              <SliderThumb id="sl-thumb" aria-label="Volume" style={thumbStyle} />
            </SliderTrack>
          </SliderControl>
        </Slider>
      </SubmitForm>
      <Slider id="rs" aria-label="Price" value={range} onValueChange={(next) => setRange(next)} onValueCommit={(next) => setCommitted(next.join("-"))} minStepsBetweenThumbs={10} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locale="en-US">
        <SliderValue id="rs-value" />
        <SliderControl>
          <SliderTrack style={track}>
            <SliderThumb index={0} aria-label="Minimum" style={thumbStyle} />
            <SliderThumb index={1} aria-label="Maximum" style={thumbStyle} />
          </SliderTrack>
        </SliderControl>
      </Slider>
      <output id="rs-state">{range.join("-") + "|" + committed}</output>
      <button id="rs-outside" type="button" onClick={() => setRange([0, 100])}>
        All
      </button>
      <Field name="brightness">
        <FieldLabel id="fsl-label">Brightness</FieldLabel>
        <Slider defaultValue={50}>
          <SliderThumb id="fsl-thumb" />
        </Slider>
      </Field>
    </main>
  )
}
