/** @jsxImportSource octane */
// Where popups render, and the parts that can sit outside their component.
// Ported from @ui-sdk/react's popup. A popup follows the tree it is written
// in, as upstream's does: hidden with it, like a page under a hidden
// <Activity>, it leaves the top layer. What differs is how its elements are
// found. Upstream also notes what a portal appended to its container, since
// React attaches no refs in a tree it renders hidden; Octane attaches them,
// so the popup's own ref is enough.
import type { Primitive } from "@ui-sdk/core"
// A namespace, as in `../primitive`: these read what moves under the same
// arguments, and Octane's compiler never reuses a member call's result.
import * as core from "@ui-sdk/core/renderer"
import {
  cloneElement,
  createContext,
  createElement,
  createPortal,
  isValidElement,
  useContext,
  useLayoutEffect,
  useState,
  type Context,
  type OctaneNode,
} from "octane"
import * as internal from "../internal.js"
import { HandleScope, useNearest } from "../internal.js"
import {
  renderElement,
  type PrimitiveHandle,
  type RenderProp,
} from "../primitive.js"
import { isProps, type Props } from "../render-element.js"
import { useControllerTarget } from "./controller-target.js"

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
  return createElement(Popup, { element, container })
}

function Popup({
  element,
  container,
}: {
  element: OctaneNode
  container: PopupContainer
}): OctaneNode {
  const target = core.portalTarget(container)
  const [tree] = useState(followTree)
  // Tells the follower when Octane shows or hides the tree. Hiding it runs
  // this cleanup, and showing it again runs the effect.
  useLayoutEffect(() => {
    tree.shown()
    return tree.hidden
  }, [tree])
  // A part's element carries the part's ref in its props, joined here by the
  // one that follows the tree.
  const tracked = isValidElement(element)
    ? cloneElement(element, {
        ref: internal.mergeRefs(refOf(element), tree.track),
      })
    : element
  const content = container
    ? createElement(InheritedContainer, { value: container }, tracked)
    : tracked
  return target ? createPortal(content, target) : content
}

// The ref an element was written with, in its props.
function refOf(element: { props: unknown }) {
  const props = element.props
  return isProps(props) ? props.ref : undefined
}

// Whether the tree a popup is written in is on screen, and what to undo when
// it is again:
//
// - shown: the tree is on screen.
// - leaving: its layout effects cleaned up. A microtask decides, so a cleanup
//   and run again in one go, as when a transition suspends, hides nothing.
// - hidden: the popup's elements were hidden, and `show` puts them back.
type Tree =
  | { at: "shown" }
  | { at: "leaving" }
  | { at: "hidden"; show: () => void }

// Hides a popup with the tree it renders in, when Octane hides that tree, like
// a hidden <Activity> or a Suspense boundary showing its fallback again, and
// shows it again with the tree. Octane hides the elements at the top of the
// tree, which never reach a portal under one of them, and leaves a popup in
// the top layer. Left there, a popup would stay shown and focused over what
// replaced its tree.
function followTree() {
  let els: HTMLElement[] = []
  let tree: Tree = { at: "leaving" }
  return {
    // The ref for the popup's element.
    track(next: Element | null) {
      if (next instanceof HTMLElement && !els.includes(next))
        els = [...els.filter((el) => el.isConnected), next]
    },
    shown() {
      if (tree.at === "hidden") tree.show()
      tree = { at: "shown" }
    },
    hidden() {
      tree = { at: "leaving" }
      queueMicrotask(() => {
        // An unmounted popup's elements left the page.
        els = els.filter((el) => el.isConnected)
        if (tree.at !== "leaving") return
        const shows = els.map(hide)
        tree = {
          at: "hidden",
          show: () => {
            for (const show of shows) show()
          },
        }
      })
    },
  }
}

// Hides an element the way Octane hides its own, unless it already is, and
// takes it and the popups in it out of the top layer. Focus leaves it first,
// since the browser would move it back to where it was before the popup
// opened. Returns what shows it again.
function hide(el: HTMLElement) {
  const active = el.ownerDocument.activeElement
  if (active instanceof HTMLElement && el.contains(active)) active.blur()
  for (const popover of [
    el,
    ...el.querySelectorAll<HTMLElement>("[popover]"),
  ]) {
    try {
      popover.hidePopover()
    } catch {
      // Not a popover, or not open.
    }
  }
  const { style } = el
  if (style.display === "none") return () => {}
  const value = style.getPropertyValue("display")
  const priority = style.getPropertyPriority("display")
  style.setProperty("display", "none", "important")
  return () => {
    style.setProperty("display", value, priority)
  }
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

export { useControllerEntry, useControllerTarget } from "./controller-target.js"

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
