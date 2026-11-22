/** @jsxImportSource octane */
// Ported from @ui-sdk/react's scroll-area (Apache-2.0, 0.1.0-beta.13).
import {
  scrollArea,
  type ScrollAreaScrollbarProps,
  type ScrollAreaScrollbarState,
  type ScrollAreaThumbState,
} from "@ui-sdk/core/scroll-area"
import { createContext, useContext, type OctaneNode } from "octane"
import { createParts, usePart, type PartProps } from "../primitive.js"

const parts = createParts(scrollArea, {
  root: "div",
  viewport: "div",
  content: "div",
  corner: "div",
  "scroll-to-end": "button",
})

// The scrollbar a thumb sits in.
const OrientationContext = createContext<"vertical" | "horizontal">("vertical")

/**
 * Groups the parts. The scrollbars are placed against it.
 */
const ScrollArea = parts.Root

/**
 * The native scroller. Keyboard, wheel, touch, find in page and screen readers scroll it.
 */
const ScrollAreaViewport = parts.Viewport

/**
 * Wraps the content inside the viewport.
 */
const ScrollAreaContent = parts.Content

// A scrollbar and its thumb are told apart by their orientation.

/**
 * A scrollbar for one axis, over the viewport's edge.
 */
function ScrollAreaScrollbar({
  orientation = "vertical",
  ...props
}: ScrollAreaScrollbarProps &
  PartProps<"div", ScrollAreaScrollbarState>): OctaneNode {
  const element = usePart(
    scrollArea,
    "scrollbar",
    { id: orientation, orientation },
    props
  )
  return <OrientationContext value={orientation}>{element}</OrientationContext>
}

/**
 * The part of the scrollbar that shows where the view is, and drags.
 */
function ScrollAreaThumb(
  props: PartProps<"div", ScrollAreaThumbState>
): OctaneNode {
  const orientation = useContext(OrientationContext)
  return usePart(scrollArea, "thumb", { id: orientation, orientation }, props)
}

/**
 * Where the two scrollbars meet.
 */
const ScrollAreaCorner = parts.Corner

/**
 * A button that scrolls to the end, like "Jump to latest". Name it with its content.
 */
const ScrollAreaScrollToEnd = parts.ScrollToEnd

export { createScrollAreaController } from "@ui-sdk/core/scroll-area"
export type {
  ScrollAreaController,
  ScrollAreaOptions,
  ScrollAreaPrimitive,
  ScrollAreaScrollOptions,
  ScrollAreaScrollToEndState,
  ScrollAreaScrollbarProps,
  ScrollAreaScrollbarState,
  ScrollAreaState,
  ScrollAreaThumbState,
  ScrollAreaType,
} from "@ui-sdk/core/scroll-area"

export {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
}
