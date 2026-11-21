// Ported from @ui-sdk/react's progress (Apache-2.0, 0.1.0-beta.13).
import { progress, type ProgressValueState } from "@ui-sdk/core/progress"
import { createElement, type OctaneNode } from "octane"
import { createParts, type PartProps } from "../primitive.js"
import { defined } from "./octane.js"

const parts = createParts(progress, {
  root: "div",
  track: "div",
  indicator: "div",
  label: "span",
  value: "span",
})

/**
 * The root, which is the progressbar.
 */
const Progress = parts.Root

/**
 * The rail the indicator fills.
 */
const ProgressTrack = parts.Track

/**
 * The filled part of the track, as wide as the value.
 */
const ProgressIndicator = parts.Indicator

/**
 * Names the progress bar.
 */
const ProgressLabel = parts.Label

const text = (state: ProgressValueState) => state.text

/**
 * The formatted value, like "40%". Children replace it.
 */
function ProgressValue({
  children = text,
  ...props
}: PartProps<"span", ProgressValueState>): OctaneNode {
  return createElement(parts.Value, defined({ ...props, children }))
}

export type {
  GaugeLabelDetails,
  NumberFormat,
  ProgressOptions,
  ProgressPrimitive,
  ProgressState,
  ProgressStatus,
  ProgressValueState,
} from "@ui-sdk/core/progress"

export {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
}
