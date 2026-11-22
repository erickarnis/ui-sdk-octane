// Ported from @ui-sdk/react's separator (Apache-2.0, 0.1.0-beta.13): the same part under the
// same name, made by this adapter's createParts.
import { separator } from "@ui-sdk/core/separator"
import { createParts } from "../primitive.js"

const parts = createParts(separator, { root: "div" })

/**
 * A line between groups of content, announced as a separator unless it's `decorative`.
 */
const Separator = parts.Root

export { Separator }
export type {
  SeparatorOptions,
  SeparatorOrientation,
  SeparatorPrimitive,
  SeparatorState,
} from "@ui-sdk/core/separator"
