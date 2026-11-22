/** @jsxImportSource octane */
// Ported from @ui-sdk/react's list-items (Apache-2.0, 0.1.0-beta.13).
import type { ListData } from "@ui-sdk/core/select"
import type { OctaneNode } from "octane"

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
    if (typeof entry === "string") {
      return (
        <Item key={entry} value={entry}>
          {entry}
        </Item>
      )
    }
    if ("type" in entry && entry.type === "separator")
      return <Separator key={`separator-${index}`} />
    if ("type" in entry && entry.type === "group") {
      // Called, not rendered, so the group's items keep `Value`: it uses no hooks.
      const groupItems = ListItems({ items: entry.items, parts, keyOf })
      return (
        <Group key={`group-${entry.label ?? index}`}>
          {entry.label ? <GroupLabel>{entry.label}</GroupLabel> : null}
          {groupItems}
        </Group>
      )
    }
    const { value, label, disabled, keywords } = entry
    return (
      <Item
        key={keyOf(value)}
        value={value}
        label={label}
        {...(disabled !== undefined && { disabled })}
        {...(keywords && { keywords })}
      >
        {label}
      </Item>
    )
  })
}

export { ListItems, type ListParts }
