// Type tests for a part's state, as its `class`, `className`, `style`,
// `render` and `children` functions receive it, and for the content a part
// takes when that isn't a function.
//
// Compiled by `pnpm typecheck`, never run.
import type { ComponentProps, CSSProperties, OctaneNode } from "octane"
import { createParts, type PartNode } from "../../src/primitive"
import { list } from "./primitives"

const List = createParts(list, {
  root: "ul",
  item: "li",
  handle: "button",
  "drag-preview": "div",
})
declare const content: OctaneNode
declare const node: PartNode

// Every function of state gets the slot's own, with nothing written out.
;<List.Root
  class={(state) => (state.empty ? "empty" : ["full", { long: state.order.length > 9 }])}
  className={(state) => state.order.join(" ")}
  style={(state) => ({ opacity: state.empty ? 0.5 : 1 })}
  render={(props, state) => <ul {...props} hidden={state.empty} />}
>
  {(state) => state.order.map((value) => <List.Item key={value} value={value} />)}
</List.Root>
;<List.Item
  value="a"
  className={(state) => (state.index === 0 ? "first" : "")}
  children={(state) => state.index + 1}
/>
// @ts-expect-error The root's state has no `index`.
;<List.Root class={(state) => String(state.index)} />
// @ts-expect-error An item's state has no `order`.
;<List.Item value="a" className={(state) => state.order.join(" ")} />
// @ts-expect-error `order` is a list, not a style.
;<List.Root style={(state) => state.order} />
// @ts-expect-error `order` has no `toFixed`.
;<List.Root render={(props, state) => <ul {...props} title={state.order.toFixed()} />} />
// @ts-expect-error The root's state has no `index`.
;<List.Root>{(state) => state.index}</List.Root>

// A function that names its state's type has to name the slot's.
;<List.Item value="a" className={(state: { index: number }) => String(state.index)} />
// @ts-expect-error An item's state is `{ index }`.
;<List.Item value="a" class={(state: { name: string }) => state.name} />
// @ts-expect-error An item's state is `{ index }`.
;<List.Item value="a" style={(state: { name: string }) => state.name} />
// @ts-expect-error An item's state is `{ index }`.
;<List.Item value="a">{(state: { name: string }) => state.name}</List.Item>

// A slot with no state hands its functions an empty one.
;<List.Handle
  item="a"
  className={(state) => {
    const none: {} = state
    // @ts-expect-error A handle has no state to read.
    state.index
    return String(none)
  }}
>
  {(state) => {
    // @ts-expect-error A handle has no state to read.
    state.index
    return "⠿"
  }}
</List.Handle>

// A style function may return text, or nothing.
;<List.Root style={(state) => (state.empty ? "display:none" : undefined)} />
// A class function returns what `class` takes, not another function.
// @ts-expect-error A function isn't a class name.
;<List.Root className={(state) => () => state.empty} />
// @ts-expect-error Nor is one inside a list of class names.
;<List.Root className={["list", (state: { empty: boolean }) => state.empty]} />

// Content that isn't a function is whatever it is given: text, numbers,
// elements, lists, nothing, and an `OctaneNode` passed on from other props.
;<List.Item value="a">text</List.Item>
;<List.Item value="a">{1}</List.Item>
;<List.Item value="a">{null}</List.Item>
;<List.Item value="a">
  <b>bold</b> and {content}
</List.Item>
;<List.Item value="a">{[1, 2].map((n) => <i key={n}>{n}</i>)}</List.Item>
;<List.Item value="a">{content}</List.Item>
;<List.Item value="a">{node}</List.Item>
function Row({ value, children }: { value: string; children?: OctaneNode }) {
  return <List.Item value={value}>{children}</List.Item>
}
;<Row value="a">text</Row>

// The props of a part read from its type keep its slot's props. Its content
// is then `unknown`, as Octane's own components take it.
function Wrapped(props: ComponentProps<typeof List.Item>) {
  return <List.Item {...props} />
}
;<Wrapped value="a">{content}</Wrapped>
// @ts-expect-error Still an item: it needs a value.
;<Wrapped />
const wrapped: ComponentProps<typeof List.Item>["children"] = content
void wrapped

// A style is checked whether it is the value or what a function returns.
const faded: CSSProperties = { opacity: 0.5 }
;<List.Root style={() => faded} />
// @ts-expect-error `colour` isn't a property.
;<List.Root style={() => ({ colour: "red" })} />
