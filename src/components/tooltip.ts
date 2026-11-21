/** @jsxImportSource octane */
// Ported from @ui-sdk/react's tooltip (Apache-2.0, 0.1.0-beta.13). The
// content's payload type parameter is left out, as in this adapter's parts.
import type { SlotDefinition } from "@ui-sdk/core"
import type { BaseSlotProps } from "@ui-sdk/core/renderer"
import {
  tooltip as tooltipPrimitive,
  type TooltipContentProps,
  type TooltipContentState,
  type TooltipOptions,
  type TooltipShortcutProps,
  type TooltipShortcutState,
  type TooltipTriggerProps,
  type TooltipTriggerState,
} from "@ui-sdk/core/tooltip"
import {
  createContext,
  createElement,
  useContext,
  type OctaneNode,
} from "octane"
import { HandleScope, useNearest } from "../internal.js"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { defined } from "./octane.js"
import {
  Connected,
  renderPopup,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

// Core's declaration file spells the tooltip's `shortcut` slot out member by
// member, each optional one with `| undefined`, which this project's
// `exactOptionalPropertyTypes` refuses as a slot. The same slot as the
// definition core's other slots are declared with.
type Raw = typeof tooltipPrimitive
type RawTypes = ReturnType<Raw>["types"]
type TooltipInstance = Omit<ReturnType<Raw>, "types"> & {
  types: Omit<RawTypes, "slots"> & {
    slots: Omit<RawTypes["slots"], "shortcut"> & {
      shortcut: SlotDefinition<
        RawTypes["state"],
        RawTypes["api"],
        TooltipShortcutProps & BaseSlotProps,
        TooltipShortcutState
      >
    }
  }
}
// SAFETY: the same function, with one slot's type rewritten as above. Nothing
// about the value changes, and the slot's props and state are the ones core
// exports for it. Through `unknown`, since the two slot types don't overlap
// under `exactOptionalPropertyTypes`, which is the reason for the rewrite.
const tooltip = tooltipPrimitive as unknown as ((
  options: Parameters<Raw>[0]
) => TooltipInstance) &
  Pick<Raw, keyof Raw>

const parts = createParts(tooltip, { trigger: "button", arrow: "div" })

// Where the popup renders. Set on <Tooltip> or <TooltipContent>.
const ContainerContext = createContext<PopupContainer>(undefined)
// Whether a TooltipShortcut sits in a trigger, which may be outside its tooltip.
const InTriggerContext = createContext(false)

/**
 * The props of `Tooltip`.
 */
type TooltipProps = TooltipOptions & { children?: OctaneNode }

/**
 * A short label or hint that appears when the pointer rests on its trigger or keyboard focus reaches it.
 */
function Tooltip({ children, container, ...options }: TooltipProps) {
  const handle = usePrimitive(tooltip, options)
  useControllerEntry(options.controller, handle)
  return createElement(
    HandleScope,
    { handle },
    createElement(ContainerContext, { value: container }, children)
  )
}

type TriggerPartProps = Omit<
  PartProps<"button", TooltipTriggerState>,
  "value" | "defaultValue" | "onChange"
> &
  TooltipTriggerProps

/**
 * The element the tooltip names or describes, usually a button.
 */
function TooltipTrigger({ controller, ...props }: TriggerPartProps) {
  const { payload: _, render, ...rest } = props
  // Until the tooltip it names mounts, a trigger outside the tooltip is a plain button.
  const unconnected = () =>
    renderElement("button", { type: "button", ...rest }, render, {
      open: false,
    })
  return createElement(
    InTriggerContext,
    { value: true },
    createElement(
      Connected,
      { primitive: tooltip, controller, fallback: unconnected },
      createElement(parts.Trigger, defined(props))
    )
  )
}

/**
 * The tooltip itself, positioned against its trigger.
 */
function TooltipContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  container,
  ...props
}: PartProps<"div", TooltipContentState> & TooltipContentProps) {
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
  })
  const element = usePart(tooltip, "content", content, props)
  return element && renderPopup(element, target)
}

/**
 * An arrow on the tooltip's edge that points at its trigger.
 */
const TooltipArrow = parts.Arrow

const text = (state: TooltipShortcutState) => state.text

function ShortcutPart({
  shortcut,
  children = text,
  ...props
}: PartProps<"span", TooltipShortcutState> & TooltipShortcutProps) {
  return usePart(
    tooltip,
    "shortcut",
    defined({ shortcut }),
    { ...props, children },
    "span"
  )
}

/**
 * Shows the tooltip's shortcut, like `⌘S`, formatted for the platform.
 */
function TooltipShortcut(
  props: PartProps<"span", TooltipShortcutState> & TooltipShortcutProps
): OctaneNode {
  const inTrigger = useContext(InTriggerContext)
  if (useNearest(tooltip)) return createElement(ShortcutPart, props)
  // Inside a trigger whose tooltip hasn't mounted yet, there's no shortcut to show.
  if (inTrigger) return null
  throw new Error("Tooltip parts must be used inside <Tooltip>.")
}

export { createTooltipController } from "@ui-sdk/core/tooltip"
export type {
  TooltipApi,
  TooltipArrowState,
  TooltipContentProps,
  TooltipContentState,
  TooltipController,
  TooltipOpenChangeReason,
  TooltipOptions,
  TooltipPayloadChangeReason,
  TooltipPrimitive,
  TooltipShortcutProps,
  TooltipShortcutState,
  TooltipTriggerProps,
  TooltipTriggerState,
} from "@ui-sdk/core/tooltip"

export {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  type TooltipProps,
  TooltipShortcut,
  TooltipTrigger,
}
