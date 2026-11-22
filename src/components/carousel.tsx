/** @jsxImportSource octane */
// Ported from @ui-sdk/react's carousel (Apache-2.0, 0.1.0-beta.13).
import {
  carousel,
  type CarouselControlProps,
  type CarouselIndicatorGroupState,
  type CarouselIndicatorProps,
  type CarouselIndicatorState,
  type CarouselOptions,
  type CarouselPlayToggleState,
  type CarouselState,
  type CarouselStepState,
} from "@ui-sdk/core/carousel"
import type { OctaneNode } from "octane"
import { useNearest } from "../internal.js"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { useControllerEntry } from "./controller-target.js"
import { defined } from "./octane.js"
import { Connected } from "./popup.js"

const parts = createParts(carousel, {
  viewport: "div",
  content: "div",
  item: "div",
  previous: "button",
  next: "button",
  "indicator-group": "div",
  indicator: "button",
  "play-toggle": "button",
})

/**
 * A region of slides that scroll a page at a time. Name it with `aria-label`.
 */
function Carousel({
  page,
  defaultPage,
  onPageChange,
  onPageChangeComplete,
  playing,
  defaultPlaying,
  onPlayingChange,
  interval,
  orientation,
  align,
  slidesPerPage,
  loop,
  skipSnaps,
  dragFree,
  drag,
  controller,
  debug,
  ...props
}: CarouselOptions & PartProps<"div", CarouselState>): OctaneNode {
  const handle = usePrimitive(
    carousel,
    defined({
      page,
      defaultPage,
      onPageChange,
      onPageChangeComplete,
      playing,
      defaultPlaying,
      onPlayingChange,
      interval,
      orientation,
      align,
      slidesPerPage,
      loop,
      skipSnaps,
      dragFree,
      drag,
      controller,
      debug,
    })
  )
  useControllerEntry(controller, handle)
  return usePart(handle, "root", {}, props)
}

/**
 * The scrolling window onto the slides. Touch, wheels and keys scroll it natively.
 */
const CarouselViewport = parts.Viewport

/**
 * The row, or column, of slides inside the viewport.
 */
const CarouselContent = parts.Content

/**
 * One slide. It's labelled "1 of 5" unless it has an `aria-label`, and inert while out of view.
 */
const CarouselItem = parts.Item

// Parts that can sit outside their carousel, driven through `controller`,
// render as plain elements until it mounts.

type StepProps = Omit<
  PartProps<"button", CarouselStepState>,
  "value" | "defaultValue" | "onChange"
> &
  CarouselControlProps

// What a part outside its carousel renders with until that mounts.
const unconnected: CarouselStepState = { disabled: true }

// Previous and Next, which can sit outside their carousel.
function connectedStep(Step: typeof parts.Previous | typeof parts.Next) {
  return function CarouselStep({
    controller,
    ...props
  }: StepProps): OctaneNode {
    const { render, ...rest } = props
    return (
      <Connected
        primitive={carousel}
        controller={controller}
        fallback={() =>
          renderElement(
            "button",
            { type: "button", ...rest },
            render,
            unconnected
          )
        }
      >
        <Step {...defined(props)} />
      </Connected>
    )
  }
}

/**
 * Goes to the previous page. `aria-disabled` on the first page without `loop`, where it stays focusable.
 */
const CarouselPrevious = connectedStep(parts.Previous)

/**
 * Goes to the next page. `aria-disabled` on the last page without `loop`, where it stays focusable.
 */
const CarouselNext = connectedStep(parts.Next)

/**
 * The indicators, as a tablist with one tab stop. Its children can be a function of the state.
 */
function CarouselIndicatorGroup({
  controller,
  ...props
}: PartProps<"div", CarouselIndicatorGroupState> &
  CarouselControlProps): OctaneNode {
  const { render, ...rest } = props
  return (
    <Connected
      primitive={carousel}
      controller={controller}
      fallback={() =>
        renderElement("div", rest, render, { page: 1, pageCount: null })
      }
    >
      <parts.IndicatorGroup {...defined(props)} />
    </Connected>
  )
}

type IndicatorProps = Omit<
  PartProps<"button", CarouselIndicatorState>,
  "value" | "defaultValue" | "onChange"
> &
  CarouselIndicatorProps

/**
 * Shows a page and goes to it. Indicators past the page count hide themselves.
 */
function CarouselIndicator(props: IndicatorProps): OctaneNode {
  // In a group outside its carousel, before that mounts, it's a plain button.
  if (!useNearest(carousel)) {
    const { page, render, ...rest } = props
    return renderElement("button", { type: "button", ...rest }, render, {
      page: page ?? 0,
      selected: false,
    })
  }
  return <parts.Indicator {...defined(props)} />
}

/**
 * Starts and stops rotation. Label it from `playing` in its state, as the carousel pattern asks.
 */
function CarouselPlayToggle({
  controller,
  ...props
}: Omit<
  PartProps<"button", CarouselPlayToggleState>,
  "value" | "defaultValue" | "onChange"
> &
  CarouselControlProps): OctaneNode {
  const { render, ...rest } = props
  const unconnectedState = { playing: false, paused: false }
  return (
    <Connected
      primitive={carousel}
      controller={controller}
      fallback={() =>
        renderElement(
          "button",
          { type: "button", ...rest },
          render,
          unconnectedState
        )
      }
    >
      <parts.PlayToggle {...defined(props)} />
    </Connected>
  )
}

export { createCarouselController } from "@ui-sdk/core/carousel"
export type {
  CarouselAlign,
  CarouselApi,
  CarouselContentState,
  CarouselControlProps,
  CarouselController,
  CarouselIndicatorGroupState,
  CarouselIndicatorProps,
  CarouselIndicatorState,
  CarouselItemState,
  CarouselNextState,
  CarouselOptions,
  CarouselOrientation,
  CarouselPageChangeReason,
  CarouselPageOptions,
  CarouselPlayToggleState,
  CarouselPlayingChangeReason,
  CarouselPlayingOptions,
  CarouselPreviousState,
  CarouselPrimitive,
  CarouselSlidesPerPage,
  CarouselState,
  CarouselStepState,
  CarouselViewportState,
} from "@ui-sdk/core/carousel"

export {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPlayToggle,
  CarouselPrevious,
  CarouselViewport,
}
