/** @jsxImportSource octane */
// Ported from @ui-sdk/react's toolbar (Apache-2.0, 0.1.0-beta.13).
import {
  toolbar,
  type ToolbarGroupProps,
  type ToolbarGroupState,
  type ToolbarOptions,
  type ToolbarState,
} from "@ui-sdk/core/toolbar"
import { useId, type OctaneNode } from "octane"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { contentOf, defined } from "./octane.js"
import { ToolbarContext, ToolbarGroupContext } from "./toolbar-context.js"

const parts = createParts(toolbar, {
  button: "button",
  link: "a",
  input: "input",
  separator: "div",
})

/**
 * A row of controls with one tab stop and arrow keys between them. Toggles and
 * toggle groups inside join it. Render menu and select triggers through
 * `ToolbarButton`, and fields through `ToolbarInput`.
 */
function Toolbar({
  orientation,
  loop,
  disabled,
  controller,
  debug,
  ...props
}: ToolbarOptions & PartProps<"div", ToolbarState>): OctaneNode {
  const handle = usePrimitive(
    toolbar,
    defined({ orientation, loop, disabled, controller, debug })
  )
  // In its own context too, so a toggle can join a toolbar without bundling it.
  const element = usePart(handle, "root", {}, props)
  return <ToolbarContext value={handle}>{element}</ToolbarContext>
}

/**
 * A button in the toolbar. Arrow keys move between it and the toolbar's other items.
 */
const ToolbarButton = parts.Button

/**
 * A link in the toolbar. Arrow keys move between it and the toolbar's other items.
 */
const ToolbarLink = parts.Link

/**
 * A text field. Arrows move its caret, and leave it only from the end they point at.
 */
const ToolbarInput = parts.Input

/**
 * A group of related items in the toolbar. `disabled` disables every item in it.
 */
function ToolbarGroup({
  disabled,
  children,
  ...props
}: ToolbarGroupProps &
  Omit<PartProps<"div", ToolbarGroupState>, "disabled">): OctaneNode {
  // Toggles inside read whether the group is disabled from context.
  const content = (state: ToolbarGroupState) => {
    // Read now: JSX reads its children only when Octane renders the element.
    const inner = contentOf(children, state)
    return <ToolbarGroupContext value={state.disabled}>{inner}</ToolbarGroupContext>
  }
  return usePart(
    toolbar,
    "group",
    defined({ id: useId(), disabled }),
    { ...props, children: content }
  )
}

/**
 * A line between groups of items.
 */
const ToolbarSeparator = parts.Separator

export { createToolbarController } from "@ui-sdk/core/toolbar"
export type {
  ToolbarApi,
  ToolbarButtonProps,
  ToolbarButtonState,
  ToolbarController,
  ToolbarGroupProps,
  ToolbarGroupState,
  ToolbarInputProps,
  ToolbarInputState,
  ToolbarLinkState,
  ToolbarOptions,
  ToolbarOrientation,
  ToolbarPrimitive,
  ToolbarState,
  ToolbarSeparatorState,
} from "@ui-sdk/core/toolbar"

export {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
}
