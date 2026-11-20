/** @jsxImportSource octane */
// Where popups render, and the parts that can sit outside their component.
// Ported from @ui-sdk/react's popup. What differs is Octane's: it hides a
// portal's content with the tree the portal is written in, so nothing here
// follows a hidden <Activity> or Suspense boundary to hide the popup itself,
// as the React adapter must.
import type { Primitive } from "@ui-sdk/core"
// A namespace, as in `../primitive`: these read what moves under the same
// arguments, and Octane's compiler never reuses a member call's result.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createElement,
  createPortal,
  useContext,
  type Context,
  type OctaneNode,
} from "octane"
import * as internal from "../internal"
import { HandleScope, useNearest } from "../internal"
import {
  renderElement,
  type PrimitiveHandle,
  type RenderProp,
} from "../primitive"
import type { Props } from "../render-element"
import { useControllerTarget } from "./controller-target"

type Handle = PrimitiveHandle<Primitive>

// Where a popup renders: an element or fragment, or nothing to render in place.
type PopupContainer = Element | DocumentFragment | null | undefined

// The container the nearest popup above renders into. Popups inside it render
// there too, like a menu inside a portaled popover, unless they name their own.
const InheritedContainer = createContext<PopupContainer>(undefined)

// A popup's container: its own, else the one the popup around it renders into.
function usePopupContainer(own: PopupContainer) {
  const inherited = useContext(InheritedContainer)
  return own ?? inherited
}

// A popup's own container: the content's, else its root's.
function useOwnContainer(own: PopupContainer, root: Context<PopupContainer>) {
  const fromRoot = useContext(root)
  return own ?? fromRoot
}

// Renders a popup in place, in the top layer, or into its container. Without
// top layer support, it goes to the body. Popups inside inherit the container.
function renderPopup(element: OctaneNode, container: PopupContainer) {
  const target = core.portalTarget(container)
  const content = container
    ? createElement(InheritedContainer, { value: container }, element)
    : element
  return target ? createPortal(content, target) : content
}

/**
 * A popup content's `render`: the content, inside the full-screen viewport a
 * sheet sits in while its `viewport` slot is present: always for a drawer,
 * and for a popup while it presents as a sheet. The viewport is what goes
 * into the top layer. Its attributes are a subset of the content's, so the
 * content's render keeps it current.
 */
function sheetViewport<State extends object>(
  popup: Handle,
  render?: RenderProp<State>
) {
  return (props: Props, state: State) => {
    const element = renderElement("div", props, render, state)
    return internal.presentIn(popup, "viewport")
      ? createElement("div", internal.slotIn(popup, "viewport", {}), element)
      : element
  }
}

/**
 * Where an input renders while its popup presents as a sheet: in a header the
 * content renders at its top. The root keeps the header element, the content
 * renders it with `sheetHeader`, and the input renders into it with
 * `inSheetHeader`, so there's one input at a time.
 */
const SheetHeaderContext = createContext<
  readonly [HTMLElement | null, (header: HTMLElement | null) => void]
>([null, () => {}])

/** The header at the top of a sheet's content, while the popup's `header` slot is present. */
function sheetHeader(
  popup: Handle,
  setHeader: (header: HTMLElement | null) => void
) {
  return internal.presentIn(popup, "header")
    ? createElement(
        "div",
        internal.slotIn(popup, "header", {}, { ref: setHeader })
      )
    : null
}

/** Renders an input into the sheet's header while there is one. */
function inSheetHeader(element: OctaneNode, header: HTMLElement | null) {
  return header ? createPortal(element, header) : element
}

/**
 * A part that can sit outside its component, like a trigger in a table row:
 * its children render with the instance `controller` connects them to, once
 * that one mounts, or else with the nearest instance of `primitive`, and
 * `fallback` renders until there is one. `fallback` is a function, so a
 * connected part never builds it.
 */
function Connected({
  primitive,
  controller,
  fallback,
  children,
}: {
  primitive: Primitive
  controller: object | undefined
  fallback: () => OctaneNode
  children?: OctaneNode
}): OctaneNode {
  const nearest = useNearest(primitive)
  const handle = useControllerTarget(controller, nearest)
  if (!handle) return fallback()
  // Always in a scope of its own with a controller, so its element stays when
  // that controller's instance takes over from the nearest one.
  return controller
    ? createElement(HandleScope, { handle }, children)
    : children
}

export { useControllerEntry, useControllerTarget } from "./controller-target"

export {
  Connected,
  inSheetHeader,
  type PopupContainer,
  renderPopup,
  sheetHeader,
  SheetHeaderContext,
  sheetViewport,
  useOwnContainer,
  usePopupContainer,
}
