/** @jsxImportSource octane */
// Ported from @ui-sdk/react's trigger-menu (Apache-2.0, 0.1.0-beta.13).
// `TriggerMenu` reads its children for a `TriggerMenuContent`, so it is
// marked `descriptorChildren`: Octane then hands it the children written in a
// template as elements, not as a compiled block.
import {
  triggerMenu as triggerMenuPrimitive,
  type TriggerMenuContentProps,
  type TriggerMenuContentState,
  type TriggerMenuData,
  type TriggerMenuEmptyState,
  type TriggerMenuHintState,
  type TriggerMenuOptions,
  type TriggerMenuStatusState,
} from "@ui-sdk/core/trigger-menu"
import {
  createContext,
  createElement,
  descriptorChildren,
  useContext,
  type OctaneNode,
} from "octane"
import { HandleScope, useHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import {
  hasChild,
  Placed,
  usePlaceContent,
  usePlacedContent,
} from "./children.js"
import { EditorContext } from "./editor-context.js"
import { ListItems, type ListParts } from "./list-items.js"
import { defined, isContentFunction } from "./octane.js"
import {
  renderPopup,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(triggerMenuPrimitive, {
  input: "textarea",
  item: "div",
  "item-icon": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
})

const ContainerContext = createContext<PopupContainer>(undefined)

function useTriggerMenu() {
  return useHandle(triggerMenuPrimitive)
}

/**
 * The props of `TriggerMenu`.
 */
type TriggerMenuProps<T = string> = TriggerMenuOptions<T> & {
  children?: OctaneNode
}

/**
 * Suggestions opened by a trigger like `@` or `/` in text. Inside a TokenInput
 * it uses that editor; otherwise render a TriggerMenuInput, or pass `editor`.
 */
const TriggerMenu = descriptorChildren(function TriggerMenu<T = string>({
    children,
    container,
    editor,
    ...options
  }: TriggerMenuProps<T>): OctaneNode {
    const inherited = useContext(EditorContext)
    const menu = usePrimitive(
      triggerMenuPrimitive,
      defined({
        ...options,
        editor: editor ?? inherited,
      })
    )
    useControllerEntry(options.controller, menu)
    // A data menu renders its list, unless the app placed a TriggerMenuContent:
    // in the markup, or inside a component of its own.
    const found = hasChild(children, TriggerMenuContent)
    const [placed, place] = usePlacedContent(!found)
    const own = placed || found
    return createElement(
      HandleScope,
      { handle: menu },
      createElement(
        ContainerContext,
        { value: container },
        createElement(Placed, { value: place }, children),
        createElement(
          Placed,
          { value: null },
          own ? null : createElement(TriggerMenuContent, {})
        )
      )
    )
  })

/**
 * The text field the menu suggests into: a `<textarea>`, or an `<input>` through `render`.
 */
const TriggerMenuInput = parts.Input

/**
 * The popup that holds the suggestions, anchored at the caret.
 */
function TriggerMenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  container,
  children,
  ...props
}: PartProps<"div", TriggerMenuContentState, OctaneNode> &
  TriggerMenuContentProps): OctaneNode {
  usePlaceContent()
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
  const body = children ?? createElement(TriggerMenuList, {})
  const element = usePart(triggerMenuPrimitive, "content", content, {
    ...props,
    children: body,
  })
  return element && renderPopup(element, target)
}

/**
 * The listbox. Without children, it renders the current trigger's items, filtered.
 */
function TriggerMenuList({
  children = listItems,
  ...props
}: PartProps<"div", TriggerMenuContentState, OctaneNode>): OctaneNode {
  return usePart(triggerMenuPrimitive, "list", {}, { ...props, children })
}

const listItems = (state: TriggerMenuContentState) =>
  createElement(TriggerMenuItems, { items: state.items })

/**
 * A suggestion. Choosing it inserts it into the text.
 */
const TriggerMenuItem = parts.Item

/**
 * An icon inside a suggestion. Screen readers, typeahead and filtering skip it, and `mirror` flips
 * it in right-to-left text.
 */
const TriggerMenuItemIcon = parts.ItemIcon

/**
 * A group of items, named by its `TriggerMenuGroupLabel`.
 */
const TriggerMenuGroup = parts.Group

/**
 * The group's heading, which names the group.
 */
const TriggerMenuGroupLabel = parts.GroupLabel

/**
 * A line between items or groups, hidden from screen readers.
 */
const TriggerMenuSeparator = parts.Separator

/**
 * Shown while no item matches. Rendering it keeps the menu open with no matches; without it, the menu closes until something matches.
 */
function TriggerMenuEmpty({
  children,
  ...props
}: PartProps<"div", TriggerMenuEmptyState, OctaneNode>): OctaneNode {
  const content = (state: TriggerMenuEmptyState) =>
    isContentFunction(children)
      ? children(state)
      : state.empty
        ? children
        : null
  return usePart(
    triggerMenuPrimitive,
    "empty",
    {},
    { ...props, children: content }
  )
}

/**
 * A polite status, outside the popup. Without children, it says the count and the keys once typing pauses.
 */
function TriggerMenuStatus(
  props: PartProps<"div", TriggerMenuStatusState, OctaneNode>
): OctaneNode {
  return usePart(
    triggerMenuPrimitive,
    "status",
    { text: props.children === undefined },
    props
  )
}

/**
 * Ghost text at the caret for the arguments still to type, like `<name>`. Without children, the hints.
 */
function TriggerMenuHint(
  props: PartProps<"span", TriggerMenuHintState, OctaneNode>
): OctaneNode {
  return usePart(
    triggerMenuPrimitive,
    "hint",
    { text: props.children === undefined },
    props,
    "span"
  )
}

/**
 * Renders data items. Used by data menus, and available for custom layouts.
 */
function TriggerMenuItems({
  items,
}: {
  items: TriggerMenuData<unknown>
}): OctaneNode {
  const menu = useTriggerMenu()
  return createElement(ListItems, {
    items,
    parts: listParts,
    keyOf: menu.api.internal.keyOf,
  })
}

const listParts: ListParts = {
  Item: TriggerMenuItem,
  Group: TriggerMenuGroup,
  GroupLabel: TriggerMenuGroupLabel,
  Separator: TriggerMenuSeparator,
}

export {
  createTriggerMenuController,
  textFieldAdapter,
} from "@ui-sdk/core/trigger-menu"
export type {
  EditorChange,
  EditorReplaceOptions,
  ListFilter,
  ListItem,
  ListSeparator,
  TextEditorAdapter,
  TextRange,
  TextRect,
  Token,
  TokenInsert,
  TriggerAfter,
  TriggerArgument,
  TriggerBoundary,
  TriggerDefinition,
  TriggerItemsLoader,
  TriggerMatch,
  TriggerMenuApi,
  TriggerMenuChangeOptions,
  TriggerMenuContentProps,
  TriggerMenuContentState,
  TriggerMenuController,
  TriggerMenuData,
  TriggerMenuDataGroup,
  TriggerMenuDataItem,
  TriggerMenuDismissReason,
  TriggerMenuEmptyState,
  TriggerMenuHintState,
  TriggerMenuInputState,
  TriggerMenuItemIconProps,
  TriggerMenuItemIconState,
  TriggerMenuItemProps,
  TriggerMenuItemState,
  TriggerMenuOpenChangeReason,
  TriggerMenuOptions,
  TriggerMenuPrimitive,
  TriggerMenuQueryChangeReason,
  TriggerMenuSelectDetails,
  TriggerMenuStatusState,
  TriggerRule,
} from "@ui-sdk/core/trigger-menu"

export {
  TriggerMenu,
  TriggerMenuContent,
  TriggerMenuEmpty,
  TriggerMenuGroup,
  TriggerMenuGroupLabel,
  TriggerMenuHint,
  TriggerMenuInput,
  TriggerMenuItem,
  TriggerMenuItemIcon,
  TriggerMenuItems,
  TriggerMenuList,
  type TriggerMenuProps,
  TriggerMenuSeparator,
  TriggerMenuStatus,
}
