// Primitives the fixtures define themselves, written the way the UI SDK docs
// (node_modules/@ui-sdk/core/docs/core.md) write theirs. Each exists for a
// part of the adapter that core's ready-made primitives don't reach as
// plainly; the comment on each says which.
import {
  createChange,
  createRovingFocus,
  createTypeahead,
  definePrimitive,
  direct,
  isTypeaheadKey,
  labelOf,
  live,
  selects,
  type ChangeDetails,
} from "@ui-sdk/core"

// A change's details, without an `event` key when there is no event.
const because = <Reason extends string>(reason: Reason, event?: Event) =>
  event ? { reason, event } : { reason }

type MuteOptions = {
  muted?: boolean
  defaultMuted?: boolean
  onMutedChange?: (muted: boolean, details: ChangeDetails<"press">) => void
}

/** One part, one boolean: controlled and uncontrolled state, and a slot state for render functions. */
export const muteButton = definePrimitive({
  name: "mute-button",
  options: { muted: "boolean", defaultMuted: "boolean", onMutedChange: "callback" },
  controlled: ["muted"],
  state: (options: MuteOptions) => ({
    muted: options.muted ?? options.defaultMuted ?? false,
  }),
  sync: (options) =>
    options.muted === undefined ? {} : { muted: options.muted },
  api: (context) => {
    const change = createChange(context)
    return {
      toggle: (event?: Event) => {
        change("muted", !context.store.get().muted, because("press", event))
      },
    }
  },
  slots: (slot) => ({
    root: slot<{}, { muted: boolean }>({
      state: (state) => ({ muted: state.muted }),
      attrs: (state) => ({
        type: "button",
        "aria-pressed": String(state.muted),
      }),
      press: ({ api }, event) => api.toggle(event),
    }),
  }),
})

type RatingOptions = {
  value?: number
  defaultValue?: number
  onValueChange?: (
    value: number,
    details: ChangeDetails<"item-press" | "list-navigation">
  ) => void
}

/** A list of parts with one tab stop: roving focus, a prop per part, a part bound to its element. */
export const rating = definePrimitive({
  name: "rating",
  options: {
    value: "number",
    defaultValue: "number",
    onValueChange: "callback",
  },
  controlled: ["value"],
  state: (options: RatingOptions) => ({
    value: options.value ?? options.defaultValue ?? 0,
    focused: null as string | null,
  }),
  sync: (options) =>
    options.value === undefined ? {} : { value: options.value },
  api: (context) => {
    const change = createChange(context)
    const roving = createRovingFocus(context, {
      slot: "star",
      key: "focused",
      remember: false,
      preferred: (star) => Number(star.key) === context.store.get().value,
      claims: (state, star) =>
        state.value ? Number(star.key) === state.value : star.key === "1",
      orientation: () => "both",
      loop: () => true,
    })
    return {
      roving,
      rate: (value: number, event?: Event) =>
        change("value", value, because("item-press", event)),
      keydown(event: KeyboardEvent, el: HTMLElement) {
        const moved = roving.keydown(event, el)
        if (moved)
          change("value", Number(moved.key), because("list-navigation", event))
      },
    }
  },
  slots: (slot) => ({
    root: slot({ attrs: () => ({ role: "radiogroup" }) }),
    star: slot<{ value: string }>({
      props: { value: "string" },
      attrs: (state, part) => ({
        type: "button",
        role: "radio",
        "aria-checked": String(Number(part.key) === state.value),
        tabindex: part.api.roving.tabIndex(state, part),
        "data-filled": Number(part.key) <= state.value ? "" : undefined,
      }),
      press: ({ api, key }, event) => api.rate(Number(key), event),
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.keydown(event, el)
        },
      },
      bind: (el, part) => part.api.roving.bind(el, part),
    }),
  }),
})

type DisclosureOptions = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ChangeDetails<"press">) => void
}

/** A part that comes and goes (`present`), and an id one part makes and another points at. */
export const disclosure = definePrimitive({
  name: "disclosure",
  options: { open: "boolean", defaultOpen: "boolean", onOpenChange: "callback" },
  controlled: ["open"],
  state: (options: DisclosureOptions) => ({
    open: options.open ?? options.defaultOpen ?? false,
  }),
  sync: (options) => (options.open === undefined ? {} : { open: options.open }),
  api: (context) => {
    const change = createChange(context)
    return {
      toggle: (event?: Event) => {
        change("open", !context.store.get().open, because("press", event))
      },
    }
  },
  slots: (slot) => ({
    trigger: slot<{}, { open: boolean }>({
      state: (state) => ({ open: state.open }),
      attrs: (state, part) => ({
        type: "button",
        "aria-expanded": String(state.open),
        "aria-controls": `${part.id}-panel`,
      }),
      press: ({ api }, event) => api.toggle(event),
    }),
    panel: slot({
      present: (state) => state.open,
      attrs: (_state, part) => ({ id: `${part.id}-panel`, role: "region" }),
    }),
  }),
})

type SeatsOptions = {
  defaultValue?: string
  onValueChange?: (value: string, details: ChangeDetails<"item-press">) => void
}

/**
 * Live state: `hovered` changes an attribute core writes itself, so no seat
 * renders again for it, while a part whose render function reads it does.
 * `selects` narrows a change of `value` to the seats it takes and leaves.
 */
export const seats = definePrimitive({
  name: "seats",
  options: { defaultValue: "string", onValueChange: "callback" },
  live: ["hovered"],
  state: (options: SeatsOptions) => ({
    value: options.defaultValue ?? "",
    hovered: null as string | null,
  }),
  api: (context) => {
    const change = createChange(context)
    return {
      choose: (key: string, event?: Event) =>
        change("value", key, because("item-press", event)),
      hover: (key: string | null) => context.store.set({ hovered: key }),
    }
  },
  slots: (slot) => ({
    root: slot({ attrs: () => ({ role: "group" }) }),
    seat: slot<{ value: string }>({
      props: { value: "string" },
      selects: selects({ value: ({ key }) => [key] }),
      live: live((state, part) => ({
        "data-hovered": state.hovered === part.key ? "" : undefined,
      })),
      attrs: (state, part) => ({
        type: "button",
        "aria-pressed": String(state.value === part.key),
      }),
      press: ({ api, key }, event) => api.choose(key, event),
      on: {
        pointerenter: (_event, { api, key }) => api.hover(key),
        pointerleave: (_event, { api }) => api.hover(null),
      },
    }),
    label: slot<{}, { hovered: string | null; value: string }>({
      state: (state) => ({ hovered: state.hovered, value: state.value }),
    }),
  }),
})

/**
 * An `input` handler, which Octane attaches as onInput and React as onChange,
 * and `direct` attributes, which core keeps current between renders.
 */
export const filterList = definePrimitive({
  name: "filter-list",
  state: () => ({ query: "" }),
  api: (context) => ({
    search: (query: string) => context.store.set({ query }),
  }),
  slots: (slot) => ({
    root: slot({}),
    input: slot({
      attrs: () => ({ type: "search" }),
      on: {
        input: (event, { api }) => {
          if (event.target instanceof HTMLInputElement)
            api.search(event.target.value)
        },
      },
    }),
    item: slot<{ value: string }>({
      props: { value: "string" },
      direct: direct(["hidden"]),
      attrs: (state, part) => ({
        hidden: part.key.toLowerCase().includes(state.query.toLowerCase())
          ? undefined
          : "",
      }),
    }),
  }),
})

type PickerOptions = {
  value?: string
  defaultValue?: string
  onValueChange?: (
    value: string,
    details: ChangeDetails<"item-press">
  ) => void
}

/**
 * Roving focus with typeahead, and parts nested in an item that take its
 * `value` when theirs is left out (`from: "item"`), one of them only present
 * for the chosen item.
 */
export const picker = definePrimitive({
  name: "picker",
  options: { value: "string", defaultValue: "string", onValueChange: "callback" },
  controlled: ["value"],
  state: (options: PickerOptions) => ({
    value: options.value ?? options.defaultValue ?? "",
    focused: null as string | null,
  }),
  sync: (options) =>
    options.value === undefined ? {} : { value: options.value },
  api: (context) => {
    const change = createChange(context)
    const roving = createRovingFocus(context, {
      slot: "item",
      key: "focused",
      orientation: () => "vertical",
      preferred: (item) => item.key === context.store.get().value,
    })
    const typeahead = createTypeahead()
    return {
      roving,
      choose: (key: string, event?: Event) =>
        change("value", key, because("item-press", event)),
      keydown(event: KeyboardEvent, el: HTMLElement) {
        if (
          event.defaultPrevented ||
          roving.keydown(event, el) ||
          !isTypeaheadKey(event)
        )
          return
        const items = roving.items()
        const index = typeahead(
          event.key,
          items.map((item) => labelOf(item.el)),
          items.findIndex((item) => item.el === el)
        )
        const match = items[index]
        if (match) roving.focus(match.key)
      },
    }
  },
  slots: (slot) => ({
    root: slot({ attrs: () => ({ role: "listbox" }) }),
    item: slot<{ value: string }, { selected: boolean }>({
      props: { value: "string" },
      state: (state, part) => ({ selected: state.value === part.key }),
      attrs: (state, part) => ({
        role: "option",
        "aria-selected": String(state.value === part.key),
        tabindex: part.api.roving.tabIndex(state, part),
      }),
      press: ({ api, key }, event) => api.choose(key, event),
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.keydown(event, el)
        },
      },
      bind: (el, part) => part.api.roving.bind(el, part),
    }),
    "item-label": slot<{ value?: string }>({
      props: { value: { kind: "string", from: "item" } },
      attrs: (state, part) => ({
        "data-item": part.props.value,
        "data-chosen": state.value === part.props.value ? "" : undefined,
      }),
    }),
    "item-check": slot<{ value?: string }>({
      props: { value: { kind: "string", from: "item", required: true } },
      present: (state, part) => state.value === part.props.value,
      attrs: () => ({ "aria-hidden": "true" }),
    }),
  }),
})
