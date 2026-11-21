// A primitive and its parts in one module, which hmr.mjs edits while the page
// is open. Its counts live on `window`, since a hot update runs this module
// again and would start a module-level log over.
import { definePrimitive } from "@ui-sdk/core"
import { createParts } from "../../../src/primitive"

type Counts = { made: number; destroyed: number; bound: number; unbound: number; presses: number }
declare global {
  interface Window {
    widgetLog?: Counts
  }
}
const log = (window.widgetLog ??= { made: 0, destroyed: 0, bound: 0, unbound: 0, presses: 0 })

// hmr.mjs rewrites this line to edit the module.
export const edition = "widget edition 0"

export const widget = definePrimitive({
  name: "widget",
  options: { defaultOn: "boolean" },
  state: (options: { defaultOn?: boolean }) => ({ on: options.defaultOn ?? false }),
  api: (context) => {
    log.made++
    context.onDestroy(() => {
      log.destroyed++
    })
    return {
      toggle: () => {
        log.presses++
        context.store.set({ on: !context.store.get().on })
      },
    }
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        type: "button",
        "aria-pressed": String(state.on),
        "data-edition": edition,
      }),
      press: ({ api }) => {
        api.toggle()
      },
      bind: () => {
        log.bound++
        return () => {
          log.unbound++
        }
      },
    }),
  }),
})

export const { Root: Widget } = createParts(widget, { root: "button" })
