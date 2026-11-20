// Ported from @ui-sdk/react's collapsible (Apache-2.0, 0.1.0-beta.13): the same parts
// under the same names, made by this adapter's createParts.
import { collapsible } from "@ui-sdk/core/collapsible"
import { createParts } from "../primitive"

const parts = createParts(collapsible, {
  root: "div",
  trigger: "button",
  panel: "div",
})

/**
 * A panel of content that a button shows and hides. Put its trigger and panel inside.
 */
const Collapsible = parts.Root

/**
 * The button that opens and closes the panel. It says whether the panel is open with `aria-expanded`.
 */
const CollapsibleTrigger = parts.Trigger

/**
 * The content the trigger shows and hides. Closed, it leaves the page unless `keepMounted` or
 * `hiddenUntilFound` keeps it.
 */
const CollapsiblePanel = parts.Panel

export { createCollapsibleController } from "@ui-sdk/core/collapsible"
export type {
  CollapsibleApi,
  CollapsibleChangeOptions,
  CollapsibleController,
  CollapsibleOpenChangeReason,
  CollapsibleOptions,
  CollapsiblePanelProps,
  CollapsiblePanelState,
  CollapsiblePrimitive,
  CollapsibleState,
  CollapsibleTriggerProps,
  CollapsibleTriggerState,
} from "@ui-sdk/core/collapsible"

export { Collapsible, CollapsiblePanel, CollapsibleTrigger }
