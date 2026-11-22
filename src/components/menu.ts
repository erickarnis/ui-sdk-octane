/** @jsxImportSource octane */
// Ported from @ui-sdk/react's menu (Apache-2.0, 0.1.0-beta.13). The type
// parameters of the content's payload and of a radio group's value are left
// out, as in this adapter's parts.
import { formatShortcut } from "@ui-sdk/core"
import {
  menu as menuPrimitive,
  type MenuCheckboxItemProps,
  type MenuCheckboxItemState,
  type MenuContentProps,
  type MenuContentState,
  type MenuContextTriggerProps,
  type MenuContextTriggerState,
  type MenuData,
  type MenuDataItem,
  type MenuItemIconProps,
  type MenuItemIconState,
  type MenuItemIndicatorProps,
  type MenuItemIndicatorState,
  type MenuItemProps,
  type MenuItemState,
  type MenuOptions,
  type MenuRadioGroupProps,
  type MenuRadioGroupState,
  type MenuRadioItemProps,
  type MenuRadioItemState,
  type MenuSubTriggerProps,
  type MenuTriggerProps,
  type MenuTriggerState,
} from "@ui-sdk/core/menu"
// A namespace, so a feature is read where it's switched on.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createElement,
  descriptorChildren,
  Fragment,
  useContext,
  useId,
  useMemo,
  type OctaneNode,
} from "octane"
import {
  HandleScope,
  reading,
  sharesProps,
  useAround,
  useHandle,
} from "../internal.js"
import {
  createParts,
  renderElement,
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
import { MenubarContext } from "./menubar-context.js"
import { contentOf, defined } from "./octane.js"
import {
  Connected,
  renderPopup,
  sheetViewport,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(menuPrimitive, {
  trigger: "button",
  shortcut: "span",
  separator: "div",
})
// Radio items take their group's name, and read its value as it renders.
sharesProps(menuPrimitive, "radio-group")

// Where root popups render. Set on <Menu> or <MenuContent>.
const ContainerContext = createContext<PopupContainer>(undefined)
const GroupContext = createContext<string | null>(null)
// The checkbox or radio item an indicator belongs to.
const ItemContext = createContext<{
  item: "checkbox-item" | "radio-item"
  itemKey: string
  group?: string
} | null>(null)

function useMenu() {
  return useHandle(menuPrimitive)
}

// The name of the radio group around the part rendering, in this menu.
function useRadioGroup() {
  const name = useAround(menuPrimitive, "radio-group")?.name
  return typeof name === "string" ? name : undefined
}

// Element props that mean something else on a menu part.
type Clashing =
  | "value"
  | "defaultValue"
  | "onChange"
  | "onSelect"
  | "defaultChecked"

/**
 * The props of `Menu`.
 */
type MenuProps = MenuOptions & {
  children?: OctaneNode
}

/**
 * A list of actions and options, opened from a button or a right-click. Put its trigger and content inside.
 */
// Marked, so a template hands it children it can read for a MenuContent.
const Menu = descriptorChildren(
  function Menu({ children, items, container, ...options }: MenuProps): OctaneNode {
    const menubar = useContext(MenubarContext)
    const menu = usePrimitive(
      menuPrimitive,
      defined({
        items,
        ...options,
        menubar: menubar ? reading(menubar, () => menubar.api) : undefined,
      })
    )
    useControllerEntry(options.controller, menu)
    // A data menu renders its content, unless the app placed a MenuContent: in
    // the markup, or inside a component of its own.
    const found = hasChild(children, MenuContent)
    const [placed, place] = usePlacedContent(!!items && !found)
    const own = placed || found
    return createElement(
      HandleScope,
      { handle: menu },
      createElement(
        ContainerContext,
        { value: container },
        // A menu inside this one's content is no item of the menubar.
        createElement(
          MenubarContext,
          { value: null },
          createElement(Placed, { value: place }, children)
        ),
        createElement(
          Placed,
          { value: null },
          items && !own
            ? createElement(
                MenuContent,
                null,
                createElement(MenuItems, { items })
              )
            : null
        )
      )
    )
  }
)

type TriggerProps = MenuTriggerProps

/**
 * The button that opens the menu. A trigger outside the menu connects through `controller`.
 */
function MenuTrigger({
  controller,
  ...props
}: Omit<PartProps<"button", MenuTriggerState>, Clashing> & TriggerProps) {
  const {
    disabled,
    focusableWhenDisabled,
    payload: _,
    shortcut: __,
    render,
    ...rest
  } = props
  // Until the menu it names mounts, a trigger outside the menu is a plain button.
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
    Connected,
    { primitive: menuPrimitive, controller, fallback: unconnected },
    createElement(parts.Trigger, defined(props))
  )
}

function ContextTriggerPart({
  disabled,
  payload,
  ...props
}: PartProps<"div", MenuContextTriggerState> & MenuContextTriggerProps) {
  const menu = useMenu()
  menu.instance.use(core.menuContextTrigger)
  return usePart(
    menu,
    "context-trigger",
    defined({ id: useId(), disabled, payload }),
    props
  )
}

/**
 * An area that opens the menu at the pointer on a right-click or a long press, and on Shift+F10.
 */
function MenuContextTrigger({
  controller,
  ...props
}: PartProps<"div", MenuContextTriggerState> & MenuContextTriggerProps) {
  const { disabled, payload: _, render, ...rest } = props
  const unconnected = () =>
    renderElement("div", rest, render, { open: false, disabled: !!disabled })
  return createElement(
    Connected,
    { primitive: menuPrimitive, controller, fallback: unconnected },
    createElement(ContextTriggerPart, props)
  )
}

/**
 * The popup that holds the items, positioned against the trigger that opened it.
 */
function MenuContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  finalFocus,
  keepMounted,
  container,
  render,
  ...props
}: PartProps<"div", MenuContentState> & MenuContentProps) {
  usePlaceContent()
  const menu = useMenu()
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    finalFocus,
    keepMounted,
  })
  // Submenus render inside their parent's popup.
  const nested = menu.api.root() !== menu.api
  const element = usePart(
    menu,
    "content",
    content,
    defined({
      ...props,
      render: nested ? render : sheetViewport(menu, render),
    })
  )
  return element && (nested ? element : renderPopup(element, target))
}

/**
 * An action. Pressing it runs its `onSelect` and closes the menu, unless `closeOnSelect` is false.
 */
function MenuItem({
  value,
  label,
  disabled,
  shortcut,
  closeOnSelect,
  destructive,
  onSelect,
  render,
  children,
  ...props
}: Omit<PartProps<"div", MenuItemState>, Clashing> & MenuItemProps) {
  const menu = useMenu()
  const id = useId()
  const item = defined({
    id,
    value,
    label,
    disabled,
    shortcut,
    closeOnSelect,
    destructive,
    onSelect,
  })
  const content = (state: MenuItemState) =>
    createElement(
      Fragment,
      null,
      contentOf(children, state),
      shortcut
        ? createElement(
            MenuShortcut,
            null,
            formatShortcut(shortcut, menu.state.apple)
          )
        : null
    )
  return usePart(
    menu,
    "item",
    item,
    defined({ ...props, children: content, render })
  )
}

/**
 * Shows the keys of an item's shortcut, like `⌘S`, inside the item. Hidden from screen readers.
 */
const MenuShortcut = parts.Shortcut

/**
 * An item that checks and unchecks an option.
 */
function MenuCheckboxItem({
  value,
  label,
  disabled,
  checked,
  defaultChecked,
  onCheckedChange,
  closeOnSelect,
  render,
  ...props
}: Omit<PartProps<"div", MenuCheckboxItemState>, Clashing> &
  MenuCheckboxItemProps) {
  const menu = useMenu()
  menu.instance.use(core.menuCheckable)
  const item = defined({
    value,
    label,
    disabled,
    checked,
    defaultChecked,
    onCheckedChange,
    closeOnSelect,
  })
  const indicator = useMemo(
    () => ({ item: "checkbox-item" as const, itemKey: value }),
    [value]
  )
  return createElement(
    ItemContext,
    { value: indicator },
    usePart(menu, "checkbox-item", item, defined({ ...props, render }))
  )
}

/**
 * Radio items that share one value.
 */
function MenuRadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  render,
  ...props
}: Omit<PartProps<"div", MenuRadioGroupState>, Clashing> &
  MenuRadioGroupProps) {
  const menu = useMenu()
  menu.instance.use(core.menuCheckable)
  const generated = useId()
  const group = name ?? generated
  const part = defined({
    id: group,
    name: group,
    value,
    defaultValue,
    onValueChange,
  })
  return usePart(menu, "radio-group", part, defined({ ...props, render }))
}

/**
 * An item in a `MenuRadioGroup`. Pressing it checks its value.
 */
function MenuRadioItem({
  value,
  label,
  disabled,
  closeOnSelect,
  render,
  ...props
}: Omit<PartProps<"div", MenuRadioItemState>, Clashing> & MenuRadioItemProps) {
  const menu = useMenu()
  menu.instance.use(core.menuCheckable)
  const group = useRadioGroup()
  const item = defined({
    group: group ?? "",
    value,
    label,
    disabled,
    closeOnSelect,
  })
  const indicator = useMemo(
    () => ({ item: "radio-item" as const, itemKey: value, group: group ?? "" }),
    [value, group]
  )
  if (!group)
    throw new Error("<MenuRadioItem> must be used inside <MenuRadioGroup>.")
  return createElement(
    ItemContext,
    { value: indicator },
    usePart(menu, "radio-item", item, defined({ ...props, render }))
  )
}

/**
 * The check or dot inside a checkbox or radio item. Rendered while the item is checked, or always with `keepMounted`.
 */
function MenuItemIndicator({
  keepMounted,
  render,
  ...props
}: PartProps<"span", MenuItemIndicatorState> & MenuItemIndicatorProps) {
  const menu = useMenu()
  menu.instance.use(core.menuCheckable)
  const id = useId()
  const item = useContext(ItemContext)
  if (!item)
    throw new Error(
      "<MenuItemIndicator> must be used inside a checkbox or radio item."
    )
  const indicator = defined({ id, ...item, keepMounted })
  return usePart(
    menu,
    "item-indicator",
    indicator,
    defined({ ...props, render }),
    "span"
  )
}

/**
 * An icon inside an item or a submenu trigger. Screen readers and typeahead skip it, and `mirror`
 * flips it in right-to-left text.
 */
function MenuItemIcon({
  mirror,
  render,
  ...props
}: PartProps<"span", MenuItemIconState> & MenuItemIconProps) {
  const menu = useMenu()
  menu.instance.use(core.menuItemIcons)
  const part = defined({ id: useId(), mirror })
  return usePart(menu, "item-icon", part, defined({ ...props, render }), "span")
}

/**
 * A group of items, named by its `MenuGroupLabel`.
 */
function MenuGroup(props: PartProps<"div">) {
  const id = useId()
  // It's named by its label once the label is in the page.
  return createElement(
    GroupContext,
    { value: id },
    usePart(useMenu(), "group", { id }, props)
  )
}

/**
 * The group's heading, which names the group.
 */
function MenuGroupLabel({ render, ...props }: PartProps<"div">) {
  const menu = useMenu()
  const radioGroup = useRadioGroup()
  const plainGroup = useContext(GroupContext)
  const group = radioGroup ?? plainGroup
  if (!group)
    throw new Error(
      "<MenuGroupLabel> must be used inside <MenuGroup> or <MenuRadioGroup>."
    )
  return usePart(
    menu,
    "group-label",
    { id: group, group },
    defined({ ...props, render }),
    "div"
  )
}

/**
 * A line between items or groups.
 */
const MenuSeparator = parts.Separator

/**
 * The props of `MenuSub`.
 */
type MenuSubProps = Pick<
  MenuOptions,
  | "open"
  | "defaultOpen"
  | "onOpenChange"
  | "onOpenChangeComplete"
  | "loop"
  | "delay"
  | "controller"
  | "debug"
> & { children?: OctaneNode }

/**
 * A submenu. Put its `MenuSubTrigger` and `MenuSubContent` inside, in a menu's content.
 */
function MenuSub({ children, ...options }: MenuSubProps) {
  const parent = useMenu()
  const menu = usePrimitive(menuPrimitive, { ...options, parent: parent.api })
  return createElement(HandleScope, { handle: menu }, children)
}

/**
 * The item that opens its submenu.
 */
function MenuSubTrigger({
  disabled,
  ...props
}: Omit<PartProps<"div", MenuTriggerState>, Clashing> & MenuSubTriggerProps) {
  return usePart(useMenu(), "trigger", defined({ disabled }), props)
}

/**
 * The submenu's popup, positioned beside its trigger.
 */
const MenuSubContent = MenuContent

/**
 * Renders a data menu's items as bare parts. Used by `<Menu items>` when you place no `MenuContent`
 * of your own, and available for custom layouts.
 */
function MenuItems({ items }: { items: MenuData }): OctaneNode {
  return items.map((entry, index) => {
    const item: MenuDataItem =
      typeof entry === "string" ? { value: entry, label: entry } : entry
    switch (item.type) {
      case undefined:
      case "item":
        return createElement(
          MenuItem,
          defined({
            key: item.value,
            value: item.value,
            disabled: item.disabled,
            shortcut: item.shortcut,
            closeOnSelect: item.closeOnSelect,
            destructive: item.destructive,
          }),
          item.label
        )
      case "separator":
        return createElement(MenuSeparator, { key: `separator-${index}` })
      case "group":
        return createElement(
          MenuGroup,
          { key: `group-${index}` },
          item.label ? createElement(MenuGroupLabel, null, item.label) : null,
          createElement(MenuItems, { items: item.items })
        )
      case "checkbox":
        return createElement(
          MenuCheckboxItem,
          defined({
            key: item.value,
            value: item.value,
            disabled: item.disabled,
            checked: item.checked,
            defaultChecked: item.defaultChecked,
            closeOnSelect: item.closeOnSelect,
          }),
          item.label
        )
      case "radio-group":
        return createElement(
          MenuRadioGroup,
          defined({
            key: item.name,
            name: item.name,
            value: item.value,
            defaultValue: item.defaultValue,
          }),
          item.label ? createElement(MenuGroupLabel, null, item.label) : null,
          item.items.map((radio) =>
            createElement(
              MenuRadioItem,
              defined({
                key: radio.value,
                value: radio.value,
                disabled: radio.disabled,
              }),
              radio.label
            )
          )
        )
      case "submenu":
        // Keyed on a fragment: a submenu takes no element props.
        return createElement(
          Fragment,
          { key: `submenu-${index}` },
          createElement(
            MenuSub,
            null,
            createElement(
              MenuSubTrigger,
              defined({ disabled: item.disabled }),
              item.label
            ),
            createElement(
              MenuSubContent,
              null,
              createElement(MenuItems, { items: item.items })
            )
          )
        )
    }
  })
}

export { createMenuController } from "@ui-sdk/core/menu"
export type {
  MenuApi,
  MenuCheckboxItemProps,
  MenuCheckboxItemState,
  MenuActionDetails,
  MenuCheckedChangeDetails,
  MenuCheckedChangeReason,
  MenuContentProps,
  MenuContentState,
  MenuContextTriggerProps,
  MenuContextTriggerState,
  MenuController,
  MenuData,
  MenuDataItem,
  MenuDismissReason,
  MenuFinalFocus,
  MenuItemIconProps,
  MenuItemIconState,
  MenuItemIndicatorProps,
  MenuItemIndicatorState,
  MenuItemProps,
  MenuItemState,
  MenuOpenChangeReason,
  MenuOpenOptions,
  MenuOptions,
  MenuPayloadChangeReason,
  MenuPrimitive,
  MenuRadioGroupProps,
  MenuRadioGroupState,
  MenuRadioItemProps,
  MenuRadioItemState,
  MenuSubTriggerProps,
  MenuTriggerProps,
  MenuTriggerState,
  MenuValueChangeDetails,
  MenuValueChangeReason,
} from "@ui-sdk/core/menu"

export {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuContextTrigger,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIcon,
  MenuItemIndicator,
  MenuItems,
  type MenuProps,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  type MenuSubProps,
  MenuSubTrigger,
  MenuTrigger,
}
