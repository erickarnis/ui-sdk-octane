// Ported from @ui-sdk/react's label (Apache-2.0, 0.1.0-beta.13): the same part under the same
// name, made by this adapter's createParts.
import { label } from "@ui-sdk/core/label"
import { createParts } from "../primitive.js"

const parts = createParts(label, { root: "label" })

/**
 * A native <label> that names any control, by `htmlFor` or by wrapping it. A
 * control a <label> can't reach, like a radio group or a slider, takes it as
 * its name, and a press on the label activates it.
 */
const Label = parts.Root

export { Label }
export type { LabelOptions, LabelPrimitive } from "@ui-sdk/core/label"
