/** @jsxImportSource octane */
// Ported from @ui-sdk/react's combobox (Apache-2.0, 0.1.0-beta.13).
// `Combobox` reads its children for a `ComboboxContent` and for its items'
// labels, so it is marked `descriptorChildren`: Octane then hands it the
// children written in a template as elements, not as a compiled block.
import {
  combobox as comboboxPrimitive,
  type ComboboxChipProps,
  type ComboboxChipState,
  type ComboboxChipsOverflowState,
  type ComboboxClearState,
  type ComboboxContentProps,
  type ComboboxContentState,
  type ComboboxCreateProps,
  type ComboboxCreateState,
  type ComboboxEmptyState,
  type ComboboxInputState,
  type ComboboxItemIconProps,
  type ComboboxItemIconState,
  type ComboboxItemTextState,
  type ComboboxOptions,
  type ComboboxSelectAllState,
  type ComboboxValueProps,
  type ComboboxValueState,
  type ListData,
} from "@ui-sdk/core/combobox"
// A namespace, as in `../primitive`: Octane's compiler never reuses a member
// call's result.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createElement,
  descriptorChildren,
  Fragment,
  useContext,
  useId,
  useMemo,
  useState,
  type OctaneNode,
} from "octane"
import { HandleScope, useAround, useHandle, useNearest } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import {
  hasChild,
  settleChildren,
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
  inSheetHeader,
  renderPopup,
  sheetHeader,
  SheetHeaderContext,
  sheetViewport,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(comboboxPrimitive, {
  label: "label",
  trigger: "button",
  item: "div",
  "item-indicator": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
  status: "div",
  clear: "button",
  arrow: "div",
})

const ContainerContext = createContext<PopupContainer>(undefined)
const ChipContext = createContext<{ value: unknown } | null>(null)

function useCombobox() {
  return useHandle(comboboxPrimitive)
}

type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Combobox`.
 */
type ComboboxProps<
  T = string,
  Multiple extends boolean | undefined = false,
> = ComboboxOptions<T, Multiple> & {
  children?: OctaneNode
}

/**
 * A text input that filters a list as you type.
 * `T` is inferred from `value`, `defaultValue`, `items` or `onValueChange`, and
 * `multiple` makes the value a list.
 */
// Typed as the plain component: the marker's own type has no name on Octane 0.16,
// where a declaration that mentioned it would not resolve.
const Combobox: <T = string, Multiple extends boolean | undefined = false>(
  props: ComboboxProps<T, Multiple>
) => OctaneNode = descriptorChildren(function Combobox<
  T = string,
  Multiple extends boolean | undefined = false,
>({ children, container, ...options }: ComboboxProps<T, Multiple>): OctaneNode {
  const field = useFieldControl()
  const combobox = usePrimitive(
    comboboxPrimitive,
    defined({
      ...options,
      name: options.name ?? field?.name,
      disabled: options.disabled || field?.disabled,
    })
  )
  useControllerEntry(options.controller, combobox)
  learnLabels(combobox.api.internal, children, itemDecorations)
  const [headerElement, setHeader] = useState<HTMLElement | null>(null)
  const header = useMemo(
    () => [headerElement, setHeader] as const,
    [headerElement, setHeader]
  )
  // Before any popup reads them: see settleChildren.
  settleChildren(children)
  // A data combobox renders its list, unless the app placed a ComboboxContent:
  // in the markup, or inside a component of its own.
  const found = hasChild(children, ComboboxContent)
  const [placed, place] = usePlacedContent(!!options.items && !found)
  const own = placed || found
  return createElement(
    HandleScope,
    { handle: combobox },
    createElement(
      ContainerContext,
      { value: container },
      createElement(
        SheetHeaderContext,
        { value: header },
        createElement(Placed, { value: place }, children),
        createElement(
          Placed,
          { value: null },
          options.items && !own ? createElement(ComboboxContent, {}) : null
        ),
        createElement(FormInputs, { handle: combobox })
      )
    )
  )
})

/**
 * A visible label for the input.
 */
const ComboboxLabel = parts.Label

/**
 * The text input that filters the list and holds the chosen item's label.
 */
function ComboboxInput({
  render,
  ...props
}: Omit<
  PartProps<"input", ComboboxInputState>,
  "value" | "defaultValue" | "children" | "readOnly"
>): OctaneNode {
  const [header] = useContext(SheetHeaderContext)
  const element = {
    ...props,
    render: controlRender(useFieldControl(props), "input", render),
  }
  // While the popup presents as a sheet, the input renders in its header.
  const input = usePart(comboboxPrimitive, "input", {}, element, "input")
  return input && inSheetHeader(input, header)
}

/**
 * A button that opens and closes the list, out of the tab order.
 */
const ComboboxTrigger = parts.Trigger

/**
 * The popup that holds the list, positioned against the input.
 */
function ComboboxContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  container,
  render,
  children,
  ...props
}: PartProps<"div", ComboboxContentState, OctaneNode> &
  ComboboxContentProps): OctaneNode {
  usePlaceContent()
  const combobox = useCombobox()
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
  const [, setHeader] = useContext(SheetHeaderContext)
  // Reading the part's state subscribes, so items that arrive after the
  // combobox rendered still render the list. `combobox.state` doesn't subscribe.
  const body = (state: ComboboxContentState) =>
    createElement(
      Fragment,
      null,
      sheetHeader(combobox, setHeader),
      children !== undefined
        ? contentOf(children, state)
        : state.items && combobox.state.items && createElement(ComboboxList, {})
    )
  const element = usePart(combobox, "content", content, {
    ...props,
    children: body,
    render: sheetViewport(combobox, render),
  })
  return element && renderPopup(element, target)
}

/**
 * The listbox. Without children, it renders the combobox's `items`, filtered.
 */
function ComboboxList({
  children = listItems,
  ...props
}: PartProps<"div", ComboboxContentState, OctaneNode>): OctaneNode {
  return usePart(comboboxPrimitive, "list", {}, { ...props, children })
}

// From the part's state, so new items re-render the list. Without items it's empty.
const listItems = (state: ComboboxContentState) =>
  createElement(ComboboxItems, { items: state.items })

/**
 * An option. Pressing it selects it, or toggles it with `multiple`.
 */
const ComboboxItem = parts.Item

/**
 * The item's text, with the part the input's text matched in `<mark>`. Without string content, it shows the item's label.
 */
function ComboboxItemText({
  children,
  ...props
}: PartProps<"span", ComboboxItemTextState, OctaneNode>): OctaneNode {
  const item = useAround(comboboxPrimitive, "item")
  if (!item)
    throw new Error("<ComboboxItemText> must be used inside <ComboboxItem>.")
  const id = String(item.value)
  const label = typeof item.label === "string" ? item.label : id
  const part = { id, text: textToMark(children, label) }
  const content = isContentFunction(children)
    ? children
    : (state: ComboboxItemTextState) => markSegments(state.segments)
  return usePart(
    comboboxPrimitive,
    "item-text",
    part,
    { ...props, children: content },
    "span"
  )
}

/**
 * An option that selects every item that matches, with `multiple`: in its group inside a `ComboboxGroup`, or in the whole list.
 */
function ComboboxSelectAll({
  render,
  ...props
}: PartProps<"div", ComboboxSelectAllState, OctaneNode>): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxSelectAll)
  const group = useAround(comboboxPrimitive, "group")?.id
  const part = {
    id: core.selectAllKey(typeof group === "string" ? group : undefined),
  }
  return usePart(combobox, "select-all", part, { ...props, render }, "div")
}

/**
 * The check inside a selected item. Rendered while it's selected, or always with `keepMounted`.
 */
const ComboboxItemIndicator = parts.ItemIndicator

// Parts inside an item that aren't its label.
const itemDecorations = new Set<unknown>([ComboboxItemIndicator])

/**
 * An icon inside an item. `ComboboxValueIcon` shows the selected item's next to the input. Screen
 * readers, typeahead and filtering skip it, and `mirror` flips it in right-to-left text.
 */
const ComboboxItemIcon = /* @__PURE__ */ notLabel(function ComboboxItemIcon({
  mirror,
  render,
  ...props
}: PartProps<"span", ComboboxItemIconState, OctaneNode> &
  ComboboxItemIconProps): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxItemIcons)
  const item = useAround(comboboxPrimitive, "item")?.value
  const part = defined({
    id: useId(),
    mirror,
    item: typeof item === "string" ? item : undefined,
  })
  return usePart(combobox, "item-icon", part, { ...props, render }, "span")
})

type ValueIconProps = Omit<PartProps<"span">, "children">

/**
 * The selected item's icon, copied from its `ComboboxItemIcon`, like next to the input. Rendered
 * while one item is selected and it has an icon.
 */
function ComboboxValueIcon(props: ValueIconProps): OctaneNode {
  return useNearest(comboboxPrimitive)
    ? createElement(ComboboxValueIconPart, props)
    : null
}

function ComboboxValueIconPart(props: ValueIconProps): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxItemIcons)
  // Its content is a copy of the selected item's icon, which the core writes.
  return usePart(combobox, "value-icon", {}, props, "span")
}

/**
 * A group of items, named by its `ComboboxGroupLabel`, and hidden while none of its items shows.
 */
const ComboboxGroup = parts.Group

/**
 * The group's heading, which names the group.
 */
const ComboboxGroupLabel = parts.GroupLabel

/**
 * A line between items or groups, hidden from screen readers.
 */
const ComboboxSeparator = parts.Separator

const create = (state: ComboboxCreateState) => `Create “${state.query}”`

/**
 * An option that creates an item from the input's text. Shown while the text matches no item's label exactly.
 */
function ComboboxCreate({
  onCreate,
  minLength,
  children = create,
  ...props
}: Omit<PartProps<"div", ComboboxCreateState, OctaneNode>, Clashing> &
  ComboboxCreateProps): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxCreate)
  return usePart(combobox, "create", defined({ onCreate, minLength }), {
    ...props,
    children,
  })
}

/**
 * Shown while no item matches. Its message is announced when it appears.
 */
function ComboboxEmpty({
  children,
  ...props
}: PartProps<"div", ComboboxEmptyState, OctaneNode>): OctaneNode {
  const content = (state: ComboboxEmptyState) =>
    isContentFunction(children)
      ? children(state)
      : state.empty
        ? children
        : null
  return usePart(
    comboboxPrimitive,
    "empty",
    {},
    { ...props, children: content }
  )
}

/**
 * A polite live region for loading and result counts. Its content is yours, usually a function of its state.
 */
const ComboboxStatus = parts.Status

/**
 * A button that empties the input and selects nothing. Shown while there's something to clear.
 */
const ComboboxClear = parts.Clear

/**
 * The selected value, as a function of its state, like one chip per value. Without children, the labels joined with commas, or "France, Chile and 2 more" with `maxLabels`. Renders no element of its own.
 */
function ComboboxValue({
  maxLabels,
  getMoreLabel,
  children,
}: ComboboxValueProps & {
  children?: Content<ComboboxValueState>
}): OctaneNode {
  // Its state, without an element.
  const value = (_props: unknown, state: ComboboxValueState) =>
    createElement(
      Fragment,
      null,
      children !== undefined ? contentOf(children, state) : state.label
    )
  return usePart(
    comboboxPrimitive,
    "value",
    defined({ maxLabels, getMoreLabel }),
    { render: value }
  )
}

const more = (state: ComboboxChipsOverflowState) => `+${state.count} more`

/**
 * How many chips don't fit on the chips' line, once some collapse. Rendering it inside `ComboboxChips` turns collapsing on. Without children, "+2 more".
 */
function ComboboxChipsOverflow({
  children = more,
  ...props
}: PartProps<"span", ComboboxChipsOverflowState, OctaneNode>): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxChips)
  return usePart(combobox, "chips-overflow", {}, { ...props, children }, "span")
}

/**
 * The selected values as chips, around the input.
 */
function ComboboxChips({
  render,
  ...props
}: PartProps<"div", {}, OctaneNode>): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxChips)
  return usePart(combobox, "chips", {}, { ...props, render }, "div")
}

const label = (state: ComboboxChipState) => state.label

/**
 * One selected value. Without children, it shows the value's label.
 */
function ComboboxChip<T = string>({
  value,
  children = label,
  ...props
}: Omit<PartProps<"div", ComboboxChipState, OctaneNode>, Clashing> &
  ComboboxChipProps<T>): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxChips)
  const part = { id: combobox.api.internal.keyOf(value), value }
  const chip = useMemo(() => ({ value }), [value])
  return createElement(
    ChipContext,
    { value: chip },
    usePart(combobox, "chip", part, { ...props, children })
  )
}

/**
 * A button inside a chip that removes its value. Name it with `aria-label`.
 */
function ComboboxChipRemove({
  render,
  ...props
}: PartProps<"button", ComboboxClearState, OctaneNode>): OctaneNode {
  const combobox = useCombobox()
  combobox.instance.use(core.comboboxChips)
  const chip = useContext(ChipContext)
  if (!chip)
    throw new Error("<ComboboxChipRemove> must be used inside <ComboboxChip>.")
  const part = {
    id: combobox.api.internal.keyOf(chip.value),
    value: chip.value,
  }
  return usePart(combobox, "chip-remove", part, { ...props, render }, "button")
}

/**
 * An arrow on the popup's edge that points at the input.
 */
const ComboboxArrow = parts.Arrow

/**
 * Renders data items. Used by data comboboxes, and available for custom layouts.
 */
function ComboboxItems({ items }: { items: ListData<unknown> }): OctaneNode {
  const combobox = useCombobox()
  return createElement(ListItems, {
    items,
    parts: listParts,
    keyOf: combobox.api.internal.keyOf,
  })
}

const listParts: ListParts = {
  Item: ComboboxItem,
  Group: ComboboxGroup,
  GroupLabel: ComboboxGroupLabel,
  Separator: ComboboxSeparator,
}

export { createComboboxController } from "@ui-sdk/core/combobox"
// Core's `ComboboxValue` type ends in `Data` here, since the component has its name.
export type {
  ComboboxApi,
  ComboboxArrowState,
  ComboboxChangeOptions,
  ComboboxChipProps,
  ComboboxChipState,
  ComboboxChipsOverflowState,
  ComboboxClearProps,
  ComboboxClearState,
  ComboboxContentProps,
  ComboboxContentState,
  ComboboxController,
  ComboboxCreateProps,
  ComboboxCreateState,
  ComboboxDismissReason,
  ComboboxEmptyState,
  ComboboxInputState,
  ComboboxItemIconProps,
  ComboboxItemIconState,
  ComboboxItemIndicatorProps,
  ComboboxItemIndicatorState,
  ComboboxItemProps,
  ComboboxItemState,
  ComboboxItemTextState,
  ComboboxOpenChangeReason,
  ComboboxOptions,
  ComboboxPrimitive,
  ComboboxQueryChangeReason,
  ComboboxSelectAllState,
  ComboboxStatusState,
  ComboboxTriggerState,
  ComboboxValue as ComboboxValueData,
  ComboboxValueChangeReason,
  ComboboxValueProps,
  ComboboxValueState,
  ListAnnouncement,
  ListData,
  ListFilter,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  MatchSegment,
} from "@ui-sdk/core/combobox"

export {
  Combobox,
  ComboboxArrow,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxChipsOverflow,
  ComboboxClear,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIcon,
  ComboboxItemIndicator,
  ComboboxItems,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  type ComboboxProps,
  ComboboxSelectAll,
  ComboboxSeparator,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxValueIcon,
}
