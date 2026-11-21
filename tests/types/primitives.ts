// Primitives for the type tests, defined as an app would define its own. They
// are compiled and never run.
import { definePrimitive } from "@ui-sdk/core"
import type { PrimitiveGeneric, WithGeneric } from "@ui-sdk/core/renderer"

type ListOptions = {
  order?: string[]
  onOrderChange?: (order: string[]) => void
  dense?: boolean
}

// Every kind of slot: one with state and no props, one with props and state,
// one with a required prop and no state, one with neither, and one whose name
// has a dash.
const list = definePrimitive({
  name: "list",
  options: { order: "list", onOrderChange: "callback", dense: "boolean" },
  state: (options: ListOptions) => ({ order: options.order ?? [] }),
  api: (context) => ({
    move: (from: number, to: number) => {
      const order = [...context.store.get().order]
      order.splice(to, 0, ...order.splice(from, 1))
      context.store.set({ order })
    },
  }),
  slots: (slot) => ({
    root: slot<{}, { order: string[]; empty: boolean }>({
      state: (state) => ({
        order: state.order,
        empty: state.order.length === 0,
      }),
    }),
    item: slot<{ value: string; disabled?: boolean }, { index: number }>({
      props: { value: "string", disabled: "boolean" },
      state: (state, part) => ({ index: state.order.indexOf(part.props.value) }),
    }),
    handle: slot<{ item: string }>({ props: { item: "string" } }),
    "drag-preview": slot({}),
  }),
})

type Choice<T> = { value: T; label: string }
type PickerOptions<T, Meta = unknown> = {
  value?: T | null
  defaultValue?: T | null
  onValueChange?: (value: T | null, meta: Meta | undefined) => void
  choices?: Choice<T>[]
  meta?: Meta
}
type PickerRootState<T> = { value: T | null }
type PickerItemProps<T> = { value: T; disabled?: boolean }

// A primitive with two type parameters. Its definition is typed for `unknown`,
// and `PickerGeneric` says how its options, its root's state and its item's
// props follow from them.
const pickerPrimitive = definePrimitive({
  name: "picker",
  options: {
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    choices: "value",
    meta: "value",
  },
  state: (options: PickerOptions<unknown>) => ({
    value: options.value ?? options.defaultValue ?? null,
  }),
  api: (context) => ({
    clear: () => {
      context.store.set({ value: null })
    },
  }),
  slots: (slot) => ({
    root: slot<{}, PickerRootState<unknown>>({
      state: (state) => ({ value: state.value }),
    }),
    item: slot<PickerItemProps<unknown>, { selected: boolean }>({
      props: { value: "value", disabled: "boolean" },
      state: (state, part) => ({ selected: state.value === part.props.value }),
    }),
    label: slot<{}, { filled: boolean }>({
      state: (state) => ({ filled: state.value !== null }),
    }),
  }),
})

interface PickerGeneric extends PrimitiveGeneric {
  T: unknown
  U: unknown
  defaults: { T: string; U: undefined }
  options: PickerOptions<this["T"], this["U"]>
  state: PickerStates<this["T"]>
  props: PickerProps<this["T"]>
}
// `this` only reaches an interface's own members, so the slots are spelled
// out in aliases, as core's generics are.
type PickerStates<T> = { root: PickerRootState<T> }
type PickerProps<T> = { item: PickerItemProps<T> }

// Core's own way to attach the generic is an assertion, `as WithGeneric<…>`.
// Nothing here runs, so a declaration says the same without one.
declare const picker: WithGeneric<typeof pickerPrimitive, PickerGeneric>

export { list, picker, type Choice, type ListOptions }
