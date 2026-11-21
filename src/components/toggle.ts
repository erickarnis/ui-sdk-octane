/** @jsxImportSource octane */
// Ported from @ui-sdk/react's toggle (Apache-2.0, 0.1.0-beta.13). The group's
// type parameter is left out, as in this adapter's parts.
import {
  toggle,
  toggleGroup,
  type ToggleGroupOptions,
  type ToggleGroupState,
  type ToggleOptions,
  type ToggleState,
} from "@ui-sdk/core/toggle"
import {
  createContext,
  createElement,
  useContext,
  type OctaneNode,
} from "octane"
import { reading } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import { defined } from "./octane.js"
import { useToolbarScope } from "./toolbar-context.js"

const parts = createParts(toggle, { root: "button", icon: "span" })

// The group's own context, so a toggle can join a group without bundling it.
const ToggleGroupContext = createContext<PrimitiveHandle<
  typeof toggleGroup
> | null>(null)

/**
 * A button that stays pressed. Inside a ToggleGroup, the group decides whether it's pressed.
 */
function Toggle(
  props: ToggleOptions &
    Omit<
      PartProps<"button", ToggleState>,
      "value" | "defaultValue" | "type" | "onChange" | "onSelect"
    >
): OctaneNode {
  const group = useContext(ToggleGroupContext)
  const toolbar = useToolbarScope()
  return createElement(
    parts.Root,
    defined({
      ...props,
      group: group ? reading(group, () => group.api) : undefined,
      toolbar,
    })
  )
}

/**
 * An icon inside a toggle. A toggle with only an icon needs an `aria-label`. Screen readers skip
 * it, and `mirror` flips it in right-to-left text.
 */
const ToggleIcon = parts.Icon

/**
 * Toggles that share one value, with one tab stop and arrow keys between them.
 */
function ToggleGroup({
  value,
  defaultValue,
  onValueChange,
  multiple,
  deselectable,
  disabled,
  orientation,
  loop,
  controller,
  debug,
  ...props
}: ToggleGroupOptions &
  Omit<
    PartProps<"div", ToggleGroupState>,
    "defaultValue" | "onChange" | "onSelect"
  >) {
  const toolbar = useToolbarScope()
  const group = usePrimitive(
    toggleGroup,
    defined({
      value,
      defaultValue,
      onValueChange,
      multiple,
      deselectable,
      disabled,
      orientation,
      loop,
      controller,
      debug,
      toolbar,
    })
  )
  return createElement(
    ToggleGroupContext,
    { value: group },
    usePart(group, "group", {}, props, "div")
  )
}

export {
  createToggleController,
  createToggleGroupController,
} from "@ui-sdk/core/toggle"
export type {
  ToggleApi,
  ToggleChangeOptions,
  ToggleController,
  ToggleGroupApi,
  ToggleGroupChangeOptions,
  ToggleGroupController,
  ToggleGroupOptions,
  ToggleGroupOrientation,
  ToggleGroupPrimitive,
  ToggleGroupState,
  ToggleGroupValueChangeReason,
  ToggleIconProps,
  ToggleIconState,
  ToggleOptions,
  TogglePressedChangeReason,
  TogglePrimitive,
  ToggleState,
} from "@ui-sdk/core/toggle"

export { Toggle, ToggleGroup, ToggleIcon }
