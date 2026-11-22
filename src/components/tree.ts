/** @jsxImportSource octane */
// Ported from @ui-sdk/react's tree (Apache-2.0, 0.1.0-beta.13). `TreeItem`
// reads its children for a group, so it is marked `descriptorChildren`: Octane
// then hands it the children written in a template as elements, not as a
// compiled block.
import {
  tree as treePrimitive,
  type TreeItemData,
  type TreeItemProps,
  type TreeItemState,
  type TreeMode,
  type TreeOptions,
  type TreeState,
} from "@ui-sdk/core/tree"
import {
  createContext,
  createElement,
  descriptorChildren,
  useContext,
  type OctaneNode,
} from "octane"
import { readIn, useHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { hasChild } from "./children.js"
import { defined, isContentFunction, type Content } from "./octane.js"

const parts = createParts(treePrimitive, {
  label: "span",
  indicator: "span",
  checkbox: "span",
  group: "div",
})

// The item the items in a group belong to.
const ItemContext = createContext<string | null>(null)

// Element props that mean something else on a tree part.
type Clashing =
  | "value"
  | "defaultValue"
  | "defaultChecked"
  | "onChange"
  | "onSelect"

/**
 * The props of `Tree`.
 */
type TreeProps<Mode extends TreeMode = "single"> = Omit<
  PartProps<"div", TreeState>,
  Clashing | keyof TreeOptions | "children"
> &
  TreeOptions<Mode> & { children?: Content<TreeState> }

/**
 * A tree of items that expand and collapse, with one tab stop and arrow keys between its items.
 */
function Tree<Mode extends TreeMode = "single">({
  items,
  paths,
  mode,
  value,
  defaultValue,
  onValueChange,
  activation,
  expanded,
  defaultExpanded,
  onExpandedChange,
  expandOnPress,
  checkable,
  checked,
  defaultChecked,
  onCheckedChange,
  checkStrategy,
  onAction,
  pendingAnnouncement,
  loadChildren,
  current,
  onHighlight,
  disabled,
  focusableWhenDisabled,
  keepMounted,
  hiddenUntilFound,
  announcement,
  controller,
  debug,
  children,
  ...props
}: TreeProps<Mode>): OctaneNode {
  const tree = usePrimitive(
    treePrimitive,
    defined({
      items,
      paths,
      mode,
      value,
      defaultValue,
      onValueChange,
      activation,
      expanded,
      defaultExpanded,
      onExpandedChange,
      expandOnPress,
      checkable,
      checked,
      defaultChecked,
      onCheckedChange,
      checkStrategy,
      onAction,
      pendingAnnouncement,
      loadChildren,
      current,
      onHighlight,
      disabled,
      focusableWhenDisabled,
      keepMounted,
      hiddenUntilFound,
      announcement,
      controller,
      debug,
      // SAFETY: `onValueChange` and `onCheckedChange` take the value for
      // `mode`, which is the one the instance calls them with, since it reads
      // the same `mode`. Upstream asserts the same.
    }) as TreeOptions
  )
  // Without children, a data tree renders its items.
  const data = readIn(tree, () => tree.api.internal.items())
  const content =
    children ?? (data && createElement(TreeItems, { items: data }))
  return createElement(
    ItemContext,
    { value: null },
    usePart(tree, "root", {}, { ...props, children: content })
  )
}

type TreeItemComponentProps = Omit<
  PartProps<"div", TreeItemState>,
  Clashing | "children"
> &
  Omit<TreeItemProps, "parent"> & { children?: Content<TreeItemState> }

/**
 * An item. Put its text in a `TreeItemLabel` and its children in a
 * `TreeGroup`, which makes it a branch. Set `branch` for one whose children
 * load later, or whose group is inside a component of your own.
 */
const TreeItem = descriptorChildren(function TreeItem({
    value,
    branch,
    disabled,
    label,
    children,
    ...props
  }: TreeItemComponentProps): OctaneNode {
    const parent = useContext(ItemContext)
    const item = defined({
      value,
      parent,
      // A branch is one with a group among its children.
      branch:
        branch ??
        (isContentFunction(children)
          ? undefined
          : hasChild(children, TreeGroup) || undefined),
      disabled,
      label,
    })
    return createElement(
      ItemContext,
      { value },
      usePart(treePrimitive, "item", item, { ...props, children })
    )
  })

/**
 * The item's text, which names it. Render it as a link to make the item one.
 */
const TreeItemLabel = parts.Label

/**
 * The arrow that expands and collapses a branch. Alt or Option expands everything in it.
 */
const TreeItemIndicator = parts.Indicator

/**
 * The item's checkbox, with `checkable`. Screen readers hear the item's checked state instead.
 */
const TreeItemCheckbox = parts.Checkbox

/**
 * A branch's children. Rendered while the branch is expanded or animating closed.
 */
const TreeGroup = parts.Group

/**
 * Renders data items. Used by data trees, and available for custom layouts.
 */
function TreeItems({ items }: { items: TreeItemData[] }): OctaneNode {
  const tree = useHandle(treePrimitive)
  const checkable = tree.state.checkable
  return items.map((item) =>
    createElement(
      TreeItem,
      defined({
        key: item.value,
        value: item.value,
        branch: item.children !== undefined,
        disabled: item.disabled,
      }),
      checkable && createElement(TreeItemCheckbox, null),
      createElement(
        TreeItemLabel,
        defined({
          render: item.href
            ? createElement("a", { href: item.href })
            : undefined,
        }),
        item.label
      ),
      item.children &&
        createElement(
          TreeGroup,
          null,
          createElement(TreeItems, { items: item.children })
        )
    )
  )
}

export {
  createTreeController,
  toggleTreeChecked,
  treeCheckedStates,
  treeFromPaths,
  visibleTreeRows,
} from "@ui-sdk/core/tree"
export type {
  ListHighlightDetails,
  TreeActionDetails,
  TreeAnnouncement,
  TreeApi,
  TreeChangeOptions,
  TreeCheckStrategy,
  TreeCheckedChangeReason,
  TreeCheckedState,
  TreeCollection,
  TreeCollectionNode,
  TreeController,
  TreeExpandedChangeReason,
  TreeGroupProps,
  TreeGroupState,
  TreeItemData,
  TreeItemPartProps,
  TreeItemProps,
  TreeItemState,
  TreeOptions,
  TreePrimitive,
  TreeState,
  TreeRow,
  TreeMode,
  TreeValue,
  TreeValueChangeReason,
} from "@ui-sdk/core/tree"

export {
  Tree,
  TreeGroup,
  TreeItem,
  TreeItemCheckbox,
  TreeItemIndicator,
  TreeItemLabel,
  TreeItems,
  type TreeProps,
}
