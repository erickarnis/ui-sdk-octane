/** @jsxImportSource octane */
// Ported from @ui-sdk/react's hover-card (Apache-2.0, 0.1.0-beta.13). The
// content's payload type parameter is left out, as in this adapter's parts.
import {
  hoverCard,
  type HoverCardContentProps,
  type HoverCardContentState,
  type HoverCardOptions,
  type HoverCardTriggerProps,
  type HoverCardTriggerState,
} from "@ui-sdk/core/hover-card"
import { createContext, createElement, type OctaneNode } from "octane"
import { HandleScope } from "../internal.js"
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

const parts = createParts(hoverCard, { trigger: "a", arrow: "div" })

// Where the popup renders. Set on <HoverCard> or <HoverCardContent>.
const ContainerContext = createContext<PopupContainer>(undefined)

/**
 * The props of `HoverCard`.
 */
type HoverCardProps = HoverCardOptions & { children?: OctaneNode }

/**
 * A preview of what a link points to, shown when the pointer rests on the link or keyboard focus stays on it.
 */
function HoverCard({
  children,
  container,
  ...options
}: HoverCardProps): OctaneNode {
  const handle = usePrimitive(hoverCard, options)
  useControllerEntry(options.controller, handle)
  return createElement(
    HandleScope,
    { handle },
    createElement(ContainerContext, { value: container }, children)
  )
}

/**
 * A link by default: pressing it follows the link, and hover or focus opens the card.
 */
function HoverCardTrigger({
  controller,
  ...props
}: PartProps<"a", HoverCardTriggerState> & HoverCardTriggerProps): OctaneNode {
  const { payload: _, render, ...rest } = props
  // Until the card it names mounts, a trigger outside the card is a plain link.
  const unconnected = () => renderElement("a", rest, render, { open: false })
  return createElement(
    Connected,
    { primitive: hoverCard, controller, fallback: unconnected },
    createElement(parts.Trigger, defined(props))
  )
}

/**
 * The card itself, positioned against its trigger.
 */
function HoverCardContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  container,
  ...props
}: PartProps<"div", HoverCardContentState> & HoverCardContentProps) {
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    keepMounted,
  })
  const element = usePart(hoverCard, "content", content, props)
  return element && renderPopup(element, target)
}

/**
 * An arrow on the card's edge that points at its trigger.
 */
const HoverCardArrow = parts.Arrow

export { createHoverCardController } from "@ui-sdk/core/hover-card"
export type {
  HoverCardApi,
  HoverCardArrowState,
  HoverCardContentProps,
  HoverCardContentState,
  HoverCardController,
  HoverCardOpenChangeReason,
  HoverCardOptions,
  HoverCardPayloadChangeReason,
  HoverCardPrimitive,
  HoverCardTriggerProps,
  HoverCardTriggerState,
} from "@ui-sdk/core/hover-card"

export {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  type HoverCardProps,
  HoverCardTrigger,
}
