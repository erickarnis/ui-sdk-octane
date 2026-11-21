// Type tests for parts written by hand: the handle `usePrimitive` returns,
// `usePart` with that handle and with the primitive alone, and `PartProps`.
//
// Compiled by `pnpm typecheck`, never run.
import type { Primitive } from "@ui-sdk/core"
import type { OctaneNode } from "octane"
import {
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../../src/primitive"
import { list, picker, type ListOptions } from "./primitives"

declare const content: OctaneNode

type RootState = { order: string[]; empty: boolean }

// A root written by hand: its options, then its element's props.
function ListRoot({
  order,
  ...props
}: PartProps<"ul", RootState> & Pick<ListOptions, "order">) {
  const handle = usePrimitive(list, order ? { order } : {})

  // The handle has the primitive, its instance, and the state and api it shows.
  const same: typeof list = handle.primitive
  const known: string[] = handle.state.order
  const committed: string[] = handle.instance.get().order
  handle.api.move(0, 1)
  void same
  void known
  void committed
  // @ts-expect-error The api's `move` takes two positions.
  handle.api.move("first")
  // @ts-expect-error The list's api has no `sort`.
  handle.api.sort()
  // @ts-expect-error The state has no `value`.
  handle.state.value
  // @ts-expect-error The state is a string list, not a number.
  const wrong: number = handle.state.order
  void wrong
  // @ts-expect-error A handle is one object for the instance's life.
  handle.state = { order: [] }
  // @ts-expect-error Upstream's own components reach a handle's slots; the public one has none.
  handle.slot("root", {})

  // With the handle, the slot's state follows without naming the primitive.
  usePart(handle, "root", {}, { children: (state) => state.order.join(", ") })
  usePart(handle, "root", {}, { className: (state) => (state.empty ? "empty" : "") })
  // @ts-expect-error The state is typed, so a wrong use is caught.
  usePart(handle, "root", {}, { children: (state) => state.order.toFixed() })
  // @ts-expect-error The primitive has no such slot.
  usePart(handle, "row", {})
  // @ts-expect-error Another primitive's handle isn't this one's.
  const other: PrimitiveHandle<typeof picker> = handle
  void other

  return usePart(handle, "root", {}, props, "ul")
}

// Its users get the state its `PartProps` names.
;<ListRoot order={["a"]} className={(state) => (state.empty ? "empty" : "")}>
  {(state) => state.order.length}
</ListRoot>
;<ListRoot>text</ListRoot>
// @ts-expect-error The root's state has no `index`.
;<ListRoot>{(state) => state.index}</ListRoot>
// @ts-expect-error `href` isn't a `ul`'s.
;<ListRoot href="#" />

// A part inside the root: the primitive alone finds the nearest instance.
function ListItem({ value, ...props }: PartProps<"li", { index: number }> & { value: string }) {
  // @ts-expect-error An item takes a value.
  usePart(list, "item", {})
  // @ts-expect-error The value is a string.
  usePart(list, "item", { value: 1 })
  // @ts-expect-error The primitive has no such slot.
  usePart(list, "row", {})
  // Without props or a tag, it is a `div`.
  usePart(list, "item", { value })
  usePart(list, "item", { value }, { hidden: true })
  // @ts-expect-error A `div` has no `href`.
  usePart(list, "item", { value }, { href: "#a" })
  // The tag types the element's props.
  usePart(list, "item", { value }, { href: "#a" }, "a")
  // @ts-expect-error A button has no `href`.
  usePart(list, "item", { value }, { href: "#a" }, "button")
  // @ts-expect-error `card` isn't a tag.
  usePart(list, "item", { value }, {}, "card")
  // Content of any type passes, as it does to a part from `createParts`.
  usePart(list, "item", { value }, { children: content })
  // @ts-expect-error But not a function of another state.
  usePart(list, "item", { value }, { children: (state: { name: string }) => state.name })
  return usePart(list, "item", { value }, props, "li")
}
;<ListItem value="a">{(state) => state.index + 1}</ListItem>
// @ts-expect-error `value` is the wrapper's own, and required.
;<ListItem />

// `PartProps` takes what Octane renders as content. Its third parameter
// widens that, to `OctaneNode` for anything a caller holds.
function OpenItem({ value, ...props }: PartProps<"li", { index: number }, OctaneNode> & { value: string }) {
  return usePart(list, "item", { value }, props, "li")
}
;<OpenItem value="a">{content}</OpenItem>
// @ts-expect-error `PartProps` alone doesn't take `unknown`.
;<ListItem value="a">{content}</ListItem>
// With no state named, a function gets an empty one.
function Plain(props: PartProps<"div">) {
  return usePart(list, "drag-preview", {}, props)
}
;<Plain className={(state) => {
  // @ts-expect-error No state was named.
  state.index
  return ""
}} />

// The options are the primitive's, without the `id` the adapter makes.
usePrimitive(list, { order: ["a"], dense: true, onOrderChange: (order) => order.length })
// @ts-expect-error `order` is a list.
usePrimitive(list, { order: "a" })
// @ts-expect-error The adapter makes the instance's id.
usePrimitive(list, { id: "tracks" })
// @ts-expect-error The list has no such option.
usePrimitive(list, { sorted: true })
// @ts-expect-error Options are an object, even when empty.
usePrimitive(list)

// A primitive known only as `Primitive` still renders: any slot, any props,
// and no state to read.
function Any({ primitive }: { primitive: Primitive }) {
  const handle = usePrimitive(primitive, { anything: 1 })
  return usePart(handle, "whichever", { any: "prop" }, {
    className: (state) => {
      // @ts-expect-error Nothing is known of its state.
      state.open
      return ""
    },
  })
}
void Any
