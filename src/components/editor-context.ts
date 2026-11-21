// Ported from @ui-sdk/react's editor-context (Apache-2.0, 0.1.0-beta.13).
import type { TextEditorAdapter } from "@ui-sdk/core/trigger-menu"
import { createContext } from "octane"

// The editor a TokenInput provides, apart from its parts, so a TriggerMenu
// inside it finds its editor without bundling the token input.
const EditorContext = createContext<TextEditorAdapter | undefined>(undefined)

export { EditorContext }
