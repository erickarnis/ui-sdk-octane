// Ported from @ui-sdk/react's menubar-context (Apache-2.0, 0.1.0-beta.13).
import type { menubar } from "@ui-sdk/core/menubar"
import { createContext } from "octane"
import type { PrimitiveHandle } from "../primitive.js"

// The menubar's context, apart from the menubar, so a menu can join one
// without bundling it.
const MenubarContext = createContext<PrimitiveHandle<typeof menubar> | null>(
  null
)

export { MenubarContext }
