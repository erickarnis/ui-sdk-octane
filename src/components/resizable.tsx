// Ported from @ui-sdk/react's resizable (Apache-2.0, 0.1.0-beta.13): the same parts
// under the same names, made by this adapter's createParts.
import { resizable } from "@ui-sdk/core/resizable"
import { createParts } from "../primitive.js"

const parts = createParts(resizable, {
  root: "div",
  panel: "div",
  handle: "div",
})

/**
 * The group: lays its panels out along its orientation.
 */
const Resizable = parts.Root

/**
 * A panel. Its size is written to `--resizable-panel-size` on every frame of a
 * drag, so it never renders for a resize unless its render function reads `size`.
 */
const ResizablePanel = parts.Panel

/**
 * The handle between two panels: a focusable separator to drag or move with keys.
 */
const ResizableHandle = parts.Handle

export {
  createResizableController,
  resizableStorageKey,
} from "@ui-sdk/core/resizable"
export type {
  ResizableApi,
  ResizableChangeOptions,
  ResizableController,
  ResizableHandleProps,
  ResizableHandleState,
  ResizableLayoutChangeDetails,
  ResizableLayoutChangeReason,
  ResizableLayoutCommitDetails,
  ResizableOptions,
  ResizablePanelProps,
  ResizablePanelState,
  ResizablePrimitive,
  ResizableSize,
  ResizableState,
  ResizableStorage,
} from "@ui-sdk/core/resizable"

export { Resizable, ResizableHandle, ResizablePanel }
