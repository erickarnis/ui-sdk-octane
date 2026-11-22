/** @jsxImportSource octane */
// Ported from @ui-sdk/react's meter (Apache-2.0, 0.1.0-beta.13).
import { meter, type MeterValueState } from "@ui-sdk/core/meter"
import type { OctaneNode } from "octane"
import { createParts, type PartProps } from "../primitive.js"
import { defined } from "./octane.js"

const parts = createParts(meter, {
  root: "div",
  track: "div",
  indicator: "div",
  label: "span",
  value: "span",
})

/**
 * The root, which is the meter.
 */
const Meter = parts.Root

/**
 * The rail the indicator fills.
 */
const MeterTrack = parts.Track

/**
 * The filled part of the track, as wide as the value.
 */
const MeterIndicator = parts.Indicator

/**
 * Names the meter.
 */
const MeterLabel = parts.Label

const text = (state: MeterValueState) => state.text

/**
 * The formatted value, like "40%". Children replace it.
 */
function MeterValue({
  children = text,
  ...props
}: PartProps<"span", MeterValueState>): OctaneNode {
  return <parts.Value {...defined({ ...props, children })} />
}

export type {
  MeterLabelDetails,
  MeterOptions,
  MeterPrimitive,
  MeterState,
  MeterValueState,
  NumberFormat,
} from "@ui-sdk/core/meter"

export { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue }
