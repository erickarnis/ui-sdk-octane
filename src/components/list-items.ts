// Ported from @ui-sdk/react's list-items (Apache-2.0, 0.1.0-beta.13).
import type { ListData } from "@ui-sdk/core/select"
import { createElement, type OctaneNode } from "octane"

// A part that takes `props`. Upstream's are `React.ComponentType<any>`; here
// each says what it is given, which every list's parts take.
type Part<Props> = (props: Props) => OctaneNode
// `Value` is the items' value type; a plain string entry is its own value.
type ItemProps<Value> = {
  key: string
  value: Value | string
  label?: string
  disabled?: boolean
  keywords?: string[]
  children?: OctaneNode
}
type ContentProps = { key?: string; children?: OctaneNode }

// The parts a list renders its data with, which every list component has.
type ListParts<Value = unknown> = {
  Item: Part<ItemProps<Value>>
  Group: Part<ContentProps>
  GroupLabel: Part<ContentProps>
  Separator: Part<{ key: string }>
}


// Renders a list's data with its parts: an option per item, groups with their
// labels, and separators. Keyed by each item's key, and each group by its
// label, so a filtered list keeps its options.
function ListItems<Value>({
  items,
  parts,
  keyOf,
}: {
  items: readonly ListData<Value>[number][]
  parts: ListParts<Value>
  keyOf: (value: Value) => string
}): OctaneNode {
  const { Item, Group, GroupLabel, Separator } = parts
  return items.map((entry, index) => {
    if (typeof entry === "string")
      return createElement(Item, { key: entry, value: entry }, entry)
    if ("type" in entry && entry.type === "separator")
      return createElement(Separator, { key: `separator-${index}` })
    if ("type" in entry && entry.type === "group") {
      return createElement(
        Group,
        { key: `group-${entry.label ?? index}` },
        entry.label ? createElement(GroupLabel, null, entry.label) : null,
        // Called, not rendered, so the group's items keep `Value`: it uses no hooks.
        ListItems({ items: entry.items, parts, keyOf })
      )
    }
    const { value, label, disabled, keywords } = entry
    return createElement(
      Item,
      {
        key: keyOf(value),
        value,
        label,
        ...(disabled !== undefined && { disabled }),
        ...(keywords && { keywords }),
      },
      label
    )
  })
}

export { ListItems, type ListParts }
