/** @jsxImportSource octane */
// Ported from @ui-sdk/react's listbox (Apache-2.0, 0.1.0-beta.13).
import {
  listbox as listboxPrimitive,
  type ListData,
  type ListboxOptions,
  type ListboxState,
} from "@ui-sdk/core/listbox"
import type { OctaneNode } from "octane"
import { useHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { FormInputs } from "./form-inputs.js"
import { ListItems, type ListParts } from "./list-items.js"
import { contentOf, defined, type Content } from "./octane.js"

const parts = createParts(listboxPrimitive, {
  item: "div",
  "item-indicator": "span",
  "item-icon": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
})

function useListbox() {
  return useHandle(listboxPrimitive)
}

// Element props that mean something else on a listbox part.
type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Listbox`.
 */
type ListboxProps<
  T = string,
  Multiple extends boolean | undefined = false,
> = Omit<
  PartProps<"div", ListboxState>,
  Clashing | keyof ListboxOptions | "children"
> &
  ListboxOptions<T, Multiple> & {
    children?: Content<ListboxState>
  }

/**
 * An always-visible list to choose one option from, or several.
 * `T` is inferred from `value`, `defaultValue`, `items` or `onValueChange`, and
 * `multiple` makes the value a list.
 */
function Listbox<T = string, Multiple extends boolean | undefined = false>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  activation,
  deselectable,
  orientation,
  loop,
  virtualFocus,
  keepInView,
  items,
  itemToValue,
  isItemEqualToValue,
  onHighlight,
  disabled,
  readOnly,
  required,
  name,
  form,
  controller,
  debug,
  render,
  children,
  ...props
}: ListboxProps<T, Multiple>): OctaneNode {
  const field = useFieldControl(props)
  const listbox = usePrimitive(
    listboxPrimitive,
    defined({
      value,
      defaultValue,
      onValueChange,
      multiple,
      activation,
      deselectable,
      orientation,
      loop,
      virtualFocus,
      keepInView,
      items,
      itemToValue,
      isItemEqualToValue,
      onHighlight,
      readOnly,
      required,
      form,
      controller,
      debug,
      name: name ?? field?.name,
      disabled: disabled || field?.disabled,
    })
  )
  // Without children, a data listbox renders its items.
  const content = (state: ListboxState) => {
    if (children !== undefined) return contentOf(children, state)
    // Read now: JSX reads a property only when Octane renders the element.
    const { items: shown } = state
    return items && <ListboxItems items={shown} />
  }
  const root = {
    ...props,
    children: content,
    render: controlRender(field, "div", render),
  }
  // A hook, so called here: Octane builds JSX children when it renders them.
  const element = usePart(listbox, "root", {}, root)
  return (
    <>
      {element}
      <FormInputs handle={listbox} />
    </>
  )
}

/**
 * An option. Pressing it selects it, or toggles it with `multiple`.
 */
const ListboxItem = parts.Item

/**
 * The check inside a selected item. Rendered while it's selected, or always with `keepMounted`.
 */
const ListboxItemIndicator = parts.ItemIndicator

/**
 * An icon inside an item. Screen readers and typeahead skip it, and `mirror` flips it in right-to-left text.
 */
const ListboxItemIcon = parts.ItemIcon

/**
 * A group of items, named by its `ListboxGroupLabel`.
 */
const ListboxGroup = parts.Group

/**
 * The group's heading, which names the group.
 */
const ListboxGroupLabel = parts.GroupLabel

/**
 * A line between items or groups, hidden from screen readers.
 */
const ListboxSeparator = parts.Separator

/**
 * Renders data items. Used by data listboxes, and available for custom layouts.
 */
function ListboxItems({ items }: { items: ListData<unknown> }): OctaneNode {
  const listbox = useListbox()
  return <ListItems items={items} parts={listParts} keyOf={listbox.api.internal.keyOf} />
}

const listParts: ListParts = {
  Item: ListboxItem,
  Group: ListboxGroup,
  GroupLabel: ListboxGroupLabel,
  Separator: ListboxSeparator,
}

export { createListboxController } from "@ui-sdk/core/listbox"
export type {
  ListData,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  ListboxApi,
  ListboxChangeOptions,
  ListboxController,
  ListboxItemIconProps,
  ListboxItemIconState,
  ListboxItemIndicatorProps,
  ListboxItemIndicatorState,
  ListboxItemProps,
  ListboxItemState,
  ListboxOptions,
  ListboxPrimitive,
  ListboxState,
  ListboxValue,
  ListboxValueChangeReason,
} from "@ui-sdk/core/listbox"

export {
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIcon,
  ListboxItemIndicator,
  ListboxItems,
  type ListboxProps,
  ListboxSeparator,
}
