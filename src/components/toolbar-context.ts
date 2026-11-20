/** @jsxImportSource octane */
// Ported from @ui-sdk/react's toolbar-context (Apache-2.0, 0.1.0-beta.13).
import type { toolbar } from "@ui-sdk/core/toolbar"
import { createContext, useContext } from "octane"
import { reading } from "../internal"
import type { PrimitiveHandle } from "../primitive"

// The toolbar's context, apart from the toolbar, so a toggle or a toggle group
// can join one without bundling it.
const ToolbarContext = createContext<PrimitiveHandle<typeof toolbar> | null>(
  null
)

// Whether the toolbar group an item, toggle or toggle group sits in is disabled.
const ToolbarGroupContext = createContext(false)

// The arrow keys and tab stop of the toolbar a toggle or a toggle group sits in, if any.
function useToolbarScope() {
  const toolbar = useContext(ToolbarContext)
  const groupDisabled = useContext(ToolbarGroupContext)
  return toolbar
    ? reading(toolbar, () => toolbar.api.internal.scopeIn(groupDisabled))
    : undefined
}

export { ToolbarContext, ToolbarGroupContext, useToolbarScope }
