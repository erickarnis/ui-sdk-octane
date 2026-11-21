// The parts the mode fixtures render, made once per module graph, and two
// primitives of their own: one whose slot makes two ids, for the ids the
// adapter derives from one useId, and one that counts what it holds outside
// itself, for the instance lifecycle.
import { definePrimitive } from "@ui-sdk/core"
import { tabs } from "@ui-sdk/core/tabs"
import { createParts } from "../../../src/primitive"
import { muteButton, rating } from "../../../playground/primitives"

export { muteButton, rating }

export const { Root: MuteButton } = createParts(muteButton, { root: "button" })
export const { Root: Rating, Star } = createParts(rating, {
  root: "div",
  star: "button",
})
export const Tabs = createParts(tabs, {
  root: "div",
  list: "div",
  tab: "button",
  panel: "div",
})

export const labelled = definePrimitive({
  name: "labelled",
  options: {},
  state: () => ({}),
  api: () => ({}),
  slots: (slot) => ({
    root: slot({}),
    field: slot<{ labelId?: string; hintId?: string }>({
      props: { labelId: "id", hintId: "id" },
      attrs: (_state, part) => ({
        "aria-labelledby": part.props.labelId,
        "aria-describedby": part.props.hintId,
        "data-ids": `${part.props.labelId} ${part.props.hintId}`,
      }),
    }),
  }),
})
export const Labelled = createParts(labelled, { root: "div", field: "div" })

// What `probe` instances did, counted: made and destroyed, elements bound
// and let go, and presses heard, so a fixture sees an instance that was never
// destroyed, a part bound twice, or a press heard by two listeners.
// `items` lists each keyed item's binding and letting go, in order.
export const probeLog = {
  made: 0,
  destroyed: 0,
  bound: 0,
  unbound: 0,
  presses: 0,
  items: [] as string[],
}

export const probe = definePrimitive({
  name: "probe",
  options: { on: "boolean", defaultOn: "boolean", onOnChange: "callback" },
  controlled: ["on"],
  state: (options: {
    on?: boolean
    defaultOn?: boolean
    onOnChange?: (on: boolean) => void
  }) => ({ on: options.on ?? options.defaultOn ?? false }),
  sync: (options) => (options.on === undefined ? {} : { on: options.on }),
  api: (context) => {
    probeLog.made++
    context.onDestroy(() => {
      probeLog.destroyed++
    })
    return {
    toggle: () => {
      probeLog.presses++
      const next = !context.store.get().on
      if (context.options().on === undefined) context.store.set({ on: next })
      context.options().onOnChange?.(next)
    },
    }
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        type: "button",
        "aria-pressed": String(state.on),
      }),
      press: ({ api }) => {
        api.toggle()
      },
      bind: () => {
        probeLog.bound++
        return () => {
          probeLog.unbound++
        }
      },
    }),
    item: slot<{ value: string }>({
      props: { value: "string" },
      attrs: (_state, part) => ({ "data-item": part.key }),
      bind: (_el, part) => {
        probeLog.items.push(`+${part.key}`)
        return () => {
          probeLog.items.push(`-${part.key}`)
        }
      },
    }),
  }),
})
export const { Root: Probe, Item: ProbeItem } = createParts(probe, {
  root: "button",
  item: "span",
})
