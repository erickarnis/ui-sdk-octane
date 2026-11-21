/** @jsxImportSource octane */
// Ported from @ui-sdk/react's drawer (Apache-2.0, 0.1.0-beta.13). The
// content's payload type parameter is left out, as in this adapter's parts.
import type {
  DialogShortcutProps,
  DialogShortcutState,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"
import {
  drawer,
  type DrawerBackdropState,
  type DrawerContentProps,
  type DrawerContentState,
  type DrawerOptions,
  type DrawerOutletProps,
  type DrawerOutletState,
  type DrawerTriggerProps,
} from "@ui-sdk/core/drawer"
import {
  createContext,
  createElement,
  useContext,
  type OctaneNode,
} from "octane"
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

const parts = createParts(drawer, {
  trigger: "button",
  handle: "button",
  title: "h2",
  description: "p",
  close: "button",
  outlet: "div",
})

type TriggerPartProps = Omit<
  PartProps<"button", DialogTriggerState>,
  "value" | "defaultValue" | "onChange"
> &
  DrawerTriggerProps
type ShortcutPartProps = PartProps<"span", DialogShortcutState> &
  DialogShortcutProps

// Where the drawer renders. Set on the root or the content.
const ContainerContext = createContext<PopupContainer>(undefined)
// The trigger a Shortcut part sits in, which may be outside its drawer, and its shortcut.
const TriggerContext = createContext<{ shortcut?: string | undefined } | null>(
  null
)

/**
 * The props of `Drawer`.
 */
type DrawerProps = DrawerOptions & { children?: OctaneNode }

/**
 * A dialog presented as a sheet that slides in from an edge. Put its trigger, backdrop and content inside.
 */
function Drawer({ children, container, ...options }: DrawerProps): OctaneNode {
  const handle = usePrimitive(drawer, options)
  useControllerEntry(options.controller, handle)
  return createElement(
    HandleScope,
    { handle },
    createElement(ContainerContext, { value: container }, children)
  )
}

/**
 * The button that opens the drawer. A trigger outside the drawer, like one per table row, connects through
 * `controller`.
 */
function DrawerTrigger({ controller, ...props }: TriggerPartProps): OctaneNode {
  const {
    disabled,
    focusableWhenDisabled,
    payload: _,
    shortcut,
    render,
    ...rest
  } = props
  // Until the drawer it names mounts, a trigger outside the drawer is a plain button.
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
  return createElement(
    TriggerContext,
    { value: { shortcut } },
    createElement(
      Connected,
      { primitive: drawer, controller, fallback: unconnected },
      createElement(parts.Trigger, defined(props))
    )
  )
}

/**
 * A dim behind the drawer. Its opacity follows the drawer, so give it a color like `bg-black/20`.
 */
function DrawerBackdrop(props: PartProps<"div", DrawerBackdropState>) {
  const target = usePopupContainer(useContext(ContainerContext))
  const element = usePart(drawer, "backdrop", {}, props)
  return element && renderPopup(element, target)
}

/**
 * The sheet itself, a dialog. It renders inside a full-screen viewport the drawer positions it in.
 */
function DrawerContent({
  initialFocus,
  finalFocus,
  keepMounted,
  container,
  render,
  ...props
}: PartProps<"div", DrawerContentState> & DrawerContentProps) {
  const handle = useHandle(drawer)
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const element = usePart(
    handle,
    "content",
    defined({ initialFocus, finalFocus, keepMounted }),
    defined({ ...props, render: sheetViewport(handle, render) })
  )
  return element && renderPopup(element, target)
}

/**
 * The grabber. Pressing it moves to the next snap point; arrow keys, Home and End step. Name it, like `aria-label="Resize"`.
 */
const DrawerHandle = parts.Handle

/**
 * The drawer's title, which names it. A level 2 heading by default.
 */
const DrawerTitle = parts.Title

/**
 * Describes the drawer while it's rendered. A paragraph by default.
 */
const DrawerDescription = parts.Description

/**
 * A button that closes the drawer. An `action` runs first, and a Promise it returns keeps the drawer open
 * until it settles.
 */
const DrawerClose = parts.Close

/**
 * Shows a trigger's shortcut, like `⌘K`, inside the trigger. Hidden from screen readers, which hear `aria-keyshortcuts`.
 */
function DrawerShortcut(props: ShortcutPartProps): OctaneNode {
  const trigger = useContext(TriggerContext)
  if (useNearest(drawer))
    return createElement(ShortcutPart, {
      ...props,
      inherited: trigger?.shortcut,
    })
  // Inside a trigger whose drawer hasn't mounted yet, there's no shortcut to show.
  if (trigger) return null
  throw new Error("Drawer parts must be used inside <Drawer>.")
}

const text = (state: DialogShortcutState) => state.text

function ShortcutPart({
  inherited,
  shortcut,
  children = text,
  ...props
}: ShortcutPartProps & { inherited?: string | undefined }) {
  return usePart(
    drawer,
    "shortcut",
    defined({ shortcut: shortcut ?? inherited }),
    { ...props, children },
    "span"
  )
}

/**
 * An element that follows the drawer, like the page behind it: it plays its
 * `keyframes` as the drawer expands and gets the `--drawer-*` variables.
 * Outside the drawer, pass the drawer's `controller`.
 */
function DrawerOutlet({
  controller,
  ...props
}: PartProps<"div", DrawerOutletState> & DrawerOutletProps): OctaneNode {
  const { keyframes: _, render, ...rest } = props
  return createElement(
    Connected,
    {
      primitive: drawer,
      controller,
      fallback: () => renderElement("div", rest, render, { open: false }),
    },
    createElement(parts.Outlet, defined(props))
  )
}

export { createDrawerController, sheetPhysics } from "@ui-sdk/core/drawer"
export type {
  DrawerApi,
  DrawerBackdropState,
  DrawerContentProps,
  DrawerContentState,
  DrawerController,
  DrawerDismissAttemptDetails,
  DrawerDismissReason,
  DrawerDriver,
  DrawerHandleState,
  DrawerKeyframes,
  DrawerOpenChangeReason,
  DrawerOptions,
  DrawerOutletProps,
  DrawerOutletState,
  DrawerPayloadChangeReason,
  DrawerPrimitive,
  DrawerSide,
  DrawerSnapPointChangeReason,
  DrawerTriggerProps,
  SheetPhysics,
  SnapPoint,
} from "@ui-sdk/core/drawer"

export {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOutlet,
  type DrawerProps,
  DrawerShortcut,
  DrawerTitle,
  DrawerTrigger,
}
