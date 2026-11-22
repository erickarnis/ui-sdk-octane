/** @jsxImportSource octane */
// Ported from @ui-sdk/react's menubar (Apache-2.0, 0.1.0-beta.13).
import {
  menubar as menubarPrimitive,
  type MenubarOptions,
  type MenubarState,
} from "@ui-sdk/core/menubar"
import type { OctaneNode } from "octane"
import { usePart, usePrimitive, type PartProps } from "../primitive.js"
import { MenubarContext } from "./menubar-context.js"
import { defined } from "./octane.js"

/**
 * A row of menus, like a desktop app's: one tab stop, arrow keys between the
 * triggers and between open menus. Each `Menu` inside joins it.
 */
function Menubar({
  orientation,
  loop,
  disabled,
  modal,
  controller,
  debug,
  ...props
}: MenubarOptions & PartProps<"div", MenubarState>): OctaneNode {
  const menubar = usePrimitive(
    menubarPrimitive,
    defined({ orientation, loop, disabled, modal, controller, debug })
  )
  // In its own context, so a menu can join a menubar without bundling it.
  // A hook, so called here: Octane builds JSX children when it renders them.
  const root = usePart(menubar, "root", {}, props)
  return <MenubarContext value={menubar}>{root}</MenubarContext>
}

export { createMenubarController } from "@ui-sdk/core/menubar"
export type {
  MenubarApi,
  MenubarController,
  MenubarMember,
  MenubarOptions,
  MenubarOrientation,
  MenubarPrimitive,
  MenubarState,
} from "@ui-sdk/core/menubar"

export { Menubar }
