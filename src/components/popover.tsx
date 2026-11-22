/** @jsxImportSource octane */
// Ported from @ui-sdk/react's popover (Apache-2.0, 0.1.0-beta.13). The
// content's payload type parameter is left out, as in this adapter's parts.
import {
  popover,
  type PopoverContentProps,
  type PopoverContentState,
  type PopoverOptions,
  type PopoverShortcutProps,
  type PopoverShortcutState,
  type PopoverTriggerProps,
  type PopoverTriggerState,
} from "@ui-sdk/core/popover"
import { createContext, useContext, type OctaneNode } from "octane"
import { HandleScope, useHandle, useNearest } from "../internal.js"
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
  sheetViewport,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(popover, {
  trigger: "button",
  title: "h2",
  description: "p",
  close: "button",
  arrow: "div",
})

// Where the popup renders. Set on <Popover> or <PopoverContent>.
const ContainerContext = createContext<PopupContainer>(undefined)
// The trigger a PopoverShortcut sits in, which may be outside its popover, and its shortcut.
const TriggerContext = createContext<{ shortcut?: string | undefined } | null>(
  null
)

/**
 * The props of `Popover`.
 */
type PopoverProps = PopoverOptions & { children?: OctaneNode }

/**
 * Rich content in a floating panel, opened from a button. Put its trigger and content inside.
 */
function Popover({ children, container, ...options }: PopoverProps) {
  const handle = usePrimitive(popover, options)
  useControllerEntry(options.controller, handle)
  return (
    <HandleScope handle={handle}>
      <ContainerContext value={container}>{children}</ContainerContext>
    </HandleScope>
  )
}

/**
 * The button that opens the popover. A trigger outside the popover connects through `controller`.
 */
function PopoverTrigger({
  controller,
  ...props
}: Omit<
  PartProps<"button", PopoverTriggerState>,
  "value" | "defaultValue" | "onChange"
> &
  PopoverTriggerProps) {
  const {
    disabled,
    focusableWhenDisabled,
    payload: _,
    shortcut,
    render,
    ...rest
  } = props
  // Until the popover it names mounts, a trigger outside the popover is a plain button.
  const unconnected = () =>
    renderElement(
      "button",
      {
        type: "button",
        disabled: disabled && !focusableWhenDisabled,
        "aria-disabled": (disabled && focusableWhenDisabled) || undefined,
        ...rest,
      },
      render,
      { open: false, disabled: !!disabled }
    )
  return (
    <TriggerContext value={{ shortcut }}>
      <Connected primitive={popover} controller={controller} fallback={unconnected}>
        <parts.Trigger {...defined(props)} />
      </Connected>
    </TriggerContext>
  )
}

/**
 * The panel itself, positioned against its trigger, named by its title and described by its description.
 */
function PopoverContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  initialFocus,
  finalFocus,
  keepMounted,
  inline,
  container,
  render,
  ...props
}: PartProps<"div", PopoverContentState> & PopoverContentProps) {
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    initialFocus,
    finalFocus,
    keepMounted,
    inline,
  })
  const handle = useHandle(popover)
  const element = usePart(handle, "content", content, {
    ...props,
    render: sheetViewport(handle, render),
  })
  return element && (inline ? element : renderPopup(element, target))
}

/**
 * The popover's title, which names it. A level 2 heading by default.
 */
const PopoverTitle = parts.Title

/**
 * Describes the popover while it's rendered. A paragraph by default.
 */
const PopoverDescription = parts.Description

/**
 * A button that closes the popover.
 */
const PopoverClose = parts.Close

/**
 * An arrow on the panel's edge that points at its trigger.
 */
const PopoverArrow = parts.Arrow

type ShortcutPartProps = PartProps<"span", PopoverShortcutState> &
  PopoverShortcutProps

const text = (state: PopoverShortcutState) => state.text

function ShortcutPart({
  inherited,
  shortcut,
  children = text,
  ...props
}: ShortcutPartProps & { inherited?: string | undefined }) {
  return usePart(
    popover,
    "shortcut",
    defined({ shortcut: shortcut ?? inherited }),
    { ...props, children },
    "span"
  )
}

/**
 * Shows a trigger's shortcut, like `⌘I`, inside the trigger. Hidden from screen readers, which hear `aria-keyshortcuts`.
 */
function PopoverShortcut(props: ShortcutPartProps): OctaneNode {
  const trigger = useContext(TriggerContext)
  if (useNearest(popover))
    return <ShortcutPart {...props} inherited={trigger?.shortcut} />
  // Inside a trigger whose popover hasn't mounted yet, there's no shortcut to show.
  if (trigger) return null
  throw new Error("Popover parts must be used inside <Popover>.")
}

export { createPopoverController } from "@ui-sdk/core/popover"
export type {
  PopoverApi,
  PopoverArrowState,
  PopoverContentProps,
  PopoverContentState,
  PopoverController,
  PopoverDismissReason,
  PopoverFinalFocus,
  PopoverInitialFocus,
  PopoverOpenChangeReason,
  PopoverOptions,
  PopoverPayloadChangeReason,
  PopoverPrimitive,
  PopoverShortcutProps,
  PopoverShortcutState,
  PopoverTriggerProps,
  PopoverTriggerState,
} from "@ui-sdk/core/popover"

export {
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  type PopoverProps,
  PopoverShortcut,
  PopoverTitle,
  PopoverTrigger,
}
