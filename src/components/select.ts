/** @jsxImportSource octane */
// Ported from @ui-sdk/react's select (Apache-2.0, 0.1.0-beta.13). `Select`
// reads its children for a `SelectContent` and for its items' labels, so it
// is marked `descriptorChildren`: Octane then hands it the children written
// in a template as elements, not as a compiled block.
import {
  select as selectPrimitive,
  type ListData,
  type SelectContentProps,
  type SelectContentState,
  type SelectEmptyState,
  type SelectItemIconProps,
  type SelectItemIconState,
  type SelectItemTextState,
  type SelectOptions,
  type SelectSelectAllState,
  type SelectTriggerProps,
  type SelectTriggerState,
  type SelectValueProps,
  type SelectValueState,
} from "@ui-sdk/core/select"
// A namespace, as in `../primitive`: Octane's compiler never reuses a member
// call's result.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createElement,
  descriptorChildren,
  useId,
  type OctaneNode,
} from "octane"
import { HandleScope, useAround, useHandle, useNearest } from "../internal.js"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import {
  hasChild,
  learnLabels,
  notLabel,
  Placed,
  usePlaceContent,
  usePlacedContent,
} from "./children.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { FormInputs } from "./form-inputs.js"
import { ListItems, type ListParts } from "./list-items.js"
import { markSegments, textToMark } from "./list-text.js"
import {
  contentOf,
  defined,
  isContentFunction,
  type Content,
} from "./octane.js"
import {
  Connected,
  renderPopup,
  sheetViewport,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(selectPrimitive, {
  label: "div",
  input: "input",
  status: "div",
  item: "div",
  "item-indicator": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
  clear: "button",
  arrow: "div",
})

const ContainerContext = createContext<PopupContainer>(undefined)

function useSelect() {
  return useHandle(selectPrimitive)
}

// Element props that mean something else on a select part.
type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Select`.
 */
type SelectProps<
  T = string,
  Multiple extends boolean | undefined = false,
> = SelectOptions<T, Multiple> & {
  children?: OctaneNode
}

/**
 * Picks one value, or several, from a list in a popup.
 * `T` is inferred from `value`, `defaultValue`, `items` or `onValueChange`, and
 * `multiple` makes the value a list.
 */
// Typed as the plain component: the marker's own type has no name on Octane 0.16,
// where a declaration that mentioned it would not resolve.
const Select: <T = string, Multiple extends boolean | undefined = false>(
  props: SelectProps<T, Multiple>
) => OctaneNode = descriptorChildren(function Select<
  T = string,
  Multiple extends boolean | undefined = false,
>({ children, container, ...options }: SelectProps<T, Multiple>): OctaneNode {
  const field = useFieldControl()
  const select = usePrimitive(
    selectPrimitive,
    defined({
      ...options,
      name: options.name ?? field?.name,
      disabled: options.disabled || field?.disabled,
    })
  )
  useControllerEntry(options.controller, select)
  learnLabels(select.api.internal, children, itemDecorations)
  // A data select renders its list, unless the app placed a SelectContent:
  // in the markup, or inside a component of its own.
  const found = hasChild(children, SelectContent)
  const [placed, place] = usePlacedContent(!!options.items && !found)
  const own = placed || found
  return createElement(
    HandleScope,
    { handle: select },
    createElement(
      ContainerContext,
      { value: container },
      createElement(Placed, { value: place }, children),
      createElement(
        Placed,
        { value: null },
        options.items && !own ? createElement(SelectContent, {}) : null
      ),
      createElement(FormInputs, { handle: select })
    )
  )
})

/**
 * A visible label for the select. Pressing it focuses the trigger, like a native select's label.
 */
const SelectLabel = parts.Label

type TriggerProps = Omit<PartProps<"button", SelectTriggerState>, Clashing> &
  SelectTriggerProps

/**
 * The button that opens the list: a combobox named by the label. Typing on it selects the item that matches.
 */
function SelectTrigger({
  disabled,
  controller,
  render,
  ...props
}: TriggerProps): OctaneNode {
  const field = useFieldControl(props)
  const unconnected = () =>
    renderElement(
      "button",
      { type: "button", disabled, ...props },
      controlRender(field, "button", render),
      {
        open: false,
        disabled: !!disabled,
        readOnly: false,
        required: false,
        placeholder: true,
      }
    )
  return createElement(
    Connected,
    { primitive: selectPrimitive, controller, fallback: unconnected },
    createElement(TriggerPart, defined({ field, disabled, render, ...props }))
  )
}

function TriggerPart({
  field,
  disabled,
  render,
  children = createElement(SelectValue, {}),
  ...props
}: TriggerProps & { field: ReturnType<typeof useFieldControl> }): OctaneNode {
  // Without content, the trigger shows the value.
  const element = {
    ...props,
    children,
    render: controlRender(field, "button", render),
  }
  return usePart(
    selectPrimitive,
    "trigger",
    defined({
      disabled,
      named: !!field || props["aria-labelledby"] != null,
    }),
    element,
    "button"
  )
}

const unselected: SelectValueState = {
  value: null,
  label: "",
  labels: [],
  placeholder: true,
}

type ValueProps = Omit<PartProps<"span", SelectValueState>, Clashing> &
  SelectValueProps

/**
 * The selected item's label, or the placeholder. Renders it for you when it has no children.
 */
function SelectValue({
  placeholder,
  maxLabels,
  getMoreLabel,
  render,
  children,
  ...props
}: ValueProps): OctaneNode {
  // A trigger outside its select renders before the select it names has mounted.
  if (!useNearest(selectPrimitive)) {
    return renderElement(
      "span",
      {
        ...props,
        children: isContentFunction(children)
          ? null
          : (children ?? placeholder ?? null),
      },
      render,
      unselected
    )
  }
  return createElement(ValuePart, {
    part: defined({ placeholder, maxLabels, getMoreLabel }),
    render,
    props,
    children,
  })
}

function ValuePart({
  part,
  render,
  props,
  children,
}: {
  part: SelectValueProps
  render?: ValueProps["render"]
  props: Props
  children?: Content<SelectValueState>
}): OctaneNode {
  const select = useSelect()
  const { placeholder } = part
  const content = (state: SelectValueState) =>
    children !== undefined
      ? contentOf(children, state)
      : state.placeholder
        ? (placeholder ?? select.state.placeholder ?? null)
        : state.label
  return usePart(
    select,
    "value",
    part,
    { ...props, children: content, render },
    "span"
  )
}

/**
 * The popup that holds the items, positioned against the trigger.
 */
function SelectContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  alignItemWithTrigger,
  keepMounted,
  container,
  render,
  children,
  ...props
}: PartProps<"div", SelectContentState, OctaneNode> &
  SelectContentProps): OctaneNode {
  usePlaceContent()
  const select = useSelect()
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    alignItemWithTrigger,
    keepMounted,
  })
  // Reading the part's state subscribes, so items that arrive after the
  // select rendered still render. `select.state` doesn't subscribe.
  const body = (state: SelectContentState) =>
    children !== undefined
      ? contentOf(children, state)
      : state.items &&
        select.state.items &&
        createElement(SelectItems, { items: state.items })
  const element = usePart(select, "content", content, {
    ...props,
    children: body,
    render: sheetViewport(select, render),
  })
  return element && renderPopup(element, target)
}

// From the part's state, so new items re-render the list. Without items it's empty.
const listItems = (state: SelectContentState) =>
  createElement(SelectItems, { items: state.items })

/**
 * The listbox, when the content holds more than items, like a `SelectInput`. Without children, it renders the select's `items` that match.
 */
function SelectList({
  children = listItems,
  ...props
}: PartProps<"div", SelectContentState, OctaneNode>): OctaneNode {
  return usePart(selectPrimitive, "list", {}, { ...props, children })
}

/**
 * A search field inside `SelectContent` that filters the list while focus stays in it. Put the items in a `SelectList`. Name it with `aria-label`.
 */
const SelectInput = parts.Input

/**
 * Shown while no item matches the search. Its message is announced when it appears.
 */
function SelectEmpty({
  children,
  ...props
}: PartProps<"div", SelectEmptyState, OctaneNode>): OctaneNode {
  const content = (state: SelectEmptyState) =>
    isContentFunction(children)
      ? children(state)
      : state.empty
        ? children
        : null
  return usePart(selectPrimitive, "empty", {}, { ...props, children: content })
}

/**
 * A polite live region for loading and result counts. Its content is yours, usually a function of its state.
 */
const SelectStatus = parts.Status

/**
 * An option. Pressing it selects it, or toggles it with `multiple`.
 */
const SelectItem = parts.Item

/**
 * The item's text, with the part the search matched in `<mark>`. Without string content, it shows the item's label.
 */
function SelectItemText({
  children,
  ...props
}: PartProps<"span", SelectItemTextState, OctaneNode>): OctaneNode {
  const item = useAround(selectPrimitive, "item")
  if (!item)
    throw new Error("<SelectItemText> must be used inside <SelectItem>.")
  const id = String(item.value)
  const label = typeof item.label === "string" ? item.label : id
  const part = { id, text: textToMark(children, label) }
  const content = isContentFunction(children)
    ? children
    : (state: SelectItemTextState) => markSegments(state.segments)
  return usePart(
    selectPrimitive,
    "item-text",
    part,
    { ...props, children: content },
    "span"
  )
}

/**
 * An option that selects every item that matches, with `multiple`: in its group inside a `SelectGroup`, or in the whole list.
 */
function SelectSelectAll({
  render,
  ...props
}: PartProps<"div", SelectSelectAllState, OctaneNode>): OctaneNode {
  const select = useSelect()
  select.instance.use(core.selectSelectAll)
  const group = useAround(selectPrimitive, "group")?.id
  const part = {
    id: core.selectAllKey(typeof group === "string" ? group : undefined),
  }
  return usePart(select, "select-all", part, { ...props, render }, "div")
}

/**
 * The check inside a selected item. Rendered while it's selected, or always with `keepMounted`.
 */
const SelectItemIndicator = parts.ItemIndicator

/**
 * An icon inside an item. `SelectValueIcon` shows the selected item's in the trigger. Screen
 * readers, typeahead and filtering skip it, and `mirror` flips it in right-to-left text.
 */
const SelectItemIcon = /* @__PURE__ */ notLabel(function SelectItemIcon({
  mirror,
  render,
  ...props
}: PartProps<"span", SelectItemIconState, OctaneNode> &
  SelectItemIconProps): OctaneNode {
  const select = useSelect()
  select.instance.use(core.selectItemIcons)
  const item = useAround(selectPrimitive, "item")?.value
  const part = defined({
    id: useId(),
    mirror,
    item: typeof item === "string" ? item : undefined,
  })
  return usePart(select, "item-icon", part, { ...props, render }, "span")
})

// Parts inside an item that aren't its label.
const itemDecorations = new Set<unknown>([SelectItemIndicator])

type ValueIconProps = Omit<PartProps<"span">, "children">

/**
 * The selected item's icon, copied from its `SelectItemIcon`, like before the value in the
 * trigger. Rendered while one item is selected and it has an icon.
 */
function SelectValueIcon(props: ValueIconProps): OctaneNode {
  // A trigger outside its select renders before the select it names has mounted.
  return useNearest(selectPrimitive)
    ? createElement(SelectValueIconPart, props)
    : null
}

function SelectValueIconPart(props: ValueIconProps): OctaneNode {
  const select = useSelect()
  select.instance.use(core.selectItemIcons)
  // Its content is a copy of the selected item's icon, which the core writes.
  return usePart(select, "value-icon", {}, props, "span")
}

/**
 * A group of items, named by its `SelectGroupLabel`, and hidden while none of its items shows.
 */
const SelectGroup = parts.Group

/**
 * The group's heading, which names the group.
 */
const SelectGroupLabel = parts.GroupLabel

/**
 * A line between items or groups, hidden from screen readers.
 */
const SelectSeparator = parts.Separator

/**
 * A button that selects nothing. Shown while something is selected, or always with `keepMounted`.
 */
const SelectClear = parts.Clear

/**
 * An arrow on the popup's edge that points at the trigger.
 */
const SelectArrow = parts.Arrow

/**
 * Renders data items. Used by data selects, and available for custom layouts.
 */
function SelectItems({ items }: { items: ListData<unknown> }): OctaneNode {
  const select = useSelect()
  return createElement(ListItems, {
    items,
    parts: listParts,
    keyOf: select.api.internal.keyOf,
  })
}

const listParts: ListParts = {
  Item: SelectItem,
  Group: SelectGroup,
  GroupLabel: SelectGroupLabel,
  Separator: SelectSeparator,
}

export { createSelectController } from "@ui-sdk/core/select"
// Core's `SelectValue` type ends in `Data` here, since the component has its name.
export type {
  ListAnnouncement,
  ListData,
  ListFilter,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  MatchSegment,
  SelectApi,
  SelectArrowState,
  SelectChangeOptions,
  SelectClearProps,
  SelectClearState,
  SelectContentProps,
  SelectContentState,
  SelectController,
  SelectDismissReason,
  SelectEmptyState,
  SelectInputState,
  SelectItemIconProps,
  SelectItemIconState,
  SelectItemIndicatorProps,
  SelectItemIndicatorState,
  SelectItemProps,
  SelectItemState,
  SelectItemTextState,
  SelectOpenChangeReason,
  SelectOptions,
  SelectPrimitive,
  SelectQueryChangeReason,
  SelectSelectAllState,
  SelectStatusState,
  SelectTriggerProps,
  SelectTriggerState,
  SelectValue as SelectValueData,
  SelectValueChangeReason,
  SelectValueProps,
  SelectValueState,
} from "@ui-sdk/core/select"

export {
  Select,
  SelectArrow,
  SelectClear,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  SelectItems,
  SelectItemText,
  SelectLabel,
  SelectList,
  type SelectProps,
  SelectSelectAll,
  SelectSeparator,
  SelectStatus,
  SelectTrigger,
  SelectValue,
  SelectValueIcon,
}
