/** @jsxImportSource octane */
// Ported from @ui-sdk/react's navigation-menu (Apache-2.0, 0.1.0-beta.13).
// The type parameter of the menu's value is left out, as in this adapter's
// parts.
import {
  navigationMenu,
  type NavigationMenuContentProps,
  type NavigationMenuContentState,
  type NavigationMenuItemProps,
  type NavigationMenuItemState,
  type NavigationMenuOptions,
  type NavigationMenuState,
  type NavigationMenuViewportProps,
  type NavigationMenuViewportState,
} from "@ui-sdk/core/navigation-menu"
import {
  createContext,
  createPortal,
  useContext,
  useId,
  type OctaneNode,
} from "octane"
import { readIn, useHandle, useNearest } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { defined } from "./octane.js"
import {
  renderPopup,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(navigationMenu, {
  list: "ul",
  trigger: "button",
  link: "a",
  "link-icon": "span",
  indicator: "div",
})

// The item a part is in, by value.
const ItemContext = createContext<string | null>(null)
// Where popups render. Set on <NavigationMenu>, or on the part.
const ContainerContext = createContext<PopupContainer>(undefined)

function useItem(part: string) {
  const value = useContext(ItemContext)
  if (value === null)
    throw new Error(
      `<NavigationMenu${part}> must be used inside <NavigationMenuItem>.`
    )
  return value
}

// Element props that mean something else on a navigation menu.
type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `NavigationMenu`.
 */
type NavigationMenuProps = NavigationMenuOptions &
  Omit<PartProps<"nav", NavigationMenuState>, Clashing>

/**
 * A <nav> landmark. Inside another menu's content it's a nested menu, which
 * renders a <div> and closes with its parent.
 */
function NavigationMenu({
  value,
  defaultValue,
  onValueChange,
  onOpenChangeComplete,
  delay,
  closeDelay,
  openOnHover,
  closeOnSelect,
  orientation,
  controller,
  debug,
  container,
  ...props
}: NavigationMenuProps): OctaneNode {
  // Inside another menu's item, it's a nested menu.
  const parentMenu = useNearest(navigationMenu)
  const parentItem = useContext(ItemContext)
  const nested = !!parentMenu && parentItem !== null
  const menu = usePrimitive(
    navigationMenu,
    defined({
      value,
      defaultValue,
      onValueChange,
      onOpenChangeComplete,
      delay,
      closeDelay,
      openOnHover,
      closeOnSelect,
      orientation,
      controller,
      debug,
      parent:
        parentMenu && parentItem !== null
          ? { api: parentMenu.api, item: parentItem }
          : undefined,
    })
  )
  const element = usePart(menu, "root", {}, props, nested ? "div" : "nav")
  return (
    <ItemContext value={null}>
      <ContainerContext value={container}>{element}</ContainerContext>
    </ItemContext>
  )
}

/**
 * The list of top-level items.
 */
const NavigationMenuList = parts.List

/**
 * One item: a link, or a trigger and the content it opens.
 */
function NavigationMenuItem({
  value,
  ...props
}: Omit<PartProps<"li", NavigationMenuItemState>, Clashing> &
  NavigationMenuItemProps): OctaneNode {
  // Its value reaches a menu nested in it, and its content.
  const generated = useId()
  const item = { value: value ?? generated }
  // Called here, not in the JSX, which Octane reads only when it renders the element.
  const element = usePart(navigationMenu, "item", item, props, "li")
  return <ItemContext value={item.value}>{element}</ItemContext>
}

/**
 * The button that opens its item's content. Resting the pointer on it opens the content too.
 */
const NavigationMenuTrigger = parts.Trigger

/**
 * Renders into the viewport while its item is open, as its own popup without
 * a viewport, and in place while closed and kept.
 */
function NavigationMenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  hiddenUntilFound,
  container,
  render,
  ...props
}: Omit<PartProps<"div", NavigationMenuContentState>, Clashing> &
  NavigationMenuContentProps): OctaneNode {
  const menu = useHandle(navigationMenu)
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const value = useItem("Content")
  const content = defined({
    value,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    keepMounted,
    hiddenUntilFound,
  })
  const element = usePart(
    menu,
    "content",
    content,
    defined({ ...props, render })
  )
  if (!element) return null
  const viewport = menu.api.internal.viewportElement()
  if (viewport && readIn(menu, () => menu.api.internal.inViewport(value)))
    return createPortal(element, viewport)
  // Kept in place next to a viewport, or its own popup without one.
  return menu.state.viewport ? element : renderPopup(element, target)
}

/**
 * A link. Pressing it closes the menu, and `current` marks the current page with `aria-current="page"`.
 */
const NavigationMenuLink = parts.Link

/**
 * An icon inside a link. Screen readers skip it, and `mirror` flips it in right-to-left text.
 */
const NavigationMenuLinkIcon = parts.LinkIcon

/**
 * The one popup every content renders into. It takes the open content's size
 * as --viewport-width and --viewport-height, and moves to the open trigger.
 */
function NavigationMenuViewport({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  container,
  ...props
}: PartProps<"div", NavigationMenuViewportState> &
  NavigationMenuViewportProps): OctaneNode {
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const viewport = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
  })
  const element = usePart(navigationMenu, "viewport", viewport, props)
  return element && renderPopup(element, target)
}

/**
 * Sits under the open trigger, or under the link with `current` while every panel is closed. Screen readers
 * skip it.
 */
const NavigationMenuIndicator = parts.Indicator

export { createNavigationMenuController } from "@ui-sdk/core/navigation-menu"
export type {
  NavigationMenuApi,
  NavigationMenuChangeOptions,
  NavigationMenuContentProps,
  NavigationMenuContentState,
  NavigationMenuController,
  NavigationMenuIndicatorState,
  NavigationMenuItemProps,
  NavigationMenuItemState,
  NavigationMenuLinkIconProps,
  NavigationMenuLinkIconState,
  NavigationMenuLinkProps,
  NavigationMenuLinkState,
  NavigationMenuListState,
  NavigationMenuMotion,
  NavigationMenuOptions,
  NavigationMenuOrientation,
  NavigationMenuPrimitive,
  NavigationMenuState,
  NavigationMenuTriggerProps,
  NavigationMenuTriggerState,
  NavigationMenuValueChangeReason,
  NavigationMenuViewportProps,
  NavigationMenuViewportState,
} from "@ui-sdk/core/navigation-menu"

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkIcon,
  NavigationMenuList,
  type NavigationMenuProps,
  NavigationMenuTrigger,
  NavigationMenuViewport,
}
