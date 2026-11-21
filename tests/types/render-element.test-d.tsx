// Type tests for `renderElement`, `RenderProp` and `mergeProps`: an element
// with no primitive behind it that takes a `render` prop.
//
// Compiled by `pnpm typecheck`, never run.
import type { OctaneNode } from "octane"
import {
  mergeProps,
  renderElement,
  type PartProps,
  type RenderProp,
} from "../../src/primitive"

type CardState = { raised: boolean }

// A wrapper of your own passes its props and its `render` on, with or
// without a state.
function Card({ render, ...props }: PartProps<"div">) {
  return renderElement("div", { ...props, "data-card": "" }, render)
}
function RaisedCard({ render, ...props }: PartProps<"div", CardState>) {
  return renderElement("div", props, render, { raised: true })
}
;<Card className="card" render={<section />} />
;<RaisedCard
  className={(state) => (state.raised ? "raised" : "")}
  render={(props, state) => <div {...props} hidden={!state.raised} />}
>
  {(state) => String(state.raised)}
</RaisedCard>
// @ts-expect-error A card without a state has none to read.
;<Card className={(state) => (state.raised ? "raised" : "")} />

// A `render` function written at the call gets the tag's props and the state.
renderElement("a", { href: "#top" }, (props, state) => {
  const href: string | undefined = props.href
  // @ts-expect-error No state was passed, so there is none to read.
  state.raised
  return <a {...props} title={href} />
})
renderElement(
  "button",
  { type: "button" },
  (props, state) => <button {...props} disabled={!state.raised} />,
  { raised: false }
)
// @ts-expect-error An anchor's props have no `disabled`.
renderElement("a", {}, (props) => <a {...props} hidden={props.disabled} />)
// @ts-expect-error The state passed has no `open`.
renderElement("div", {}, (props, state) => <div {...props} hidden={state.open} />, { raised: true })
// Another tag, like a custom element's, gets its props by name.
renderElement("x-card", { elevation: 2 }, (props) => String(props.elevation))
// @ts-expect-error Props by name hold values of no known type.
renderElement("x-card", { elevation: 2 }, (props) => props.elevation.toFixed())
// @ts-expect-error The tag is a name.
renderElement(Card, {})
// @ts-expect-error The props are an object.
renderElement("div")

// `RenderProp` without a tag is for a function that renders whichever
// element it is given. It and a tag's pass for each other, so a wrapper can
// hand a part's `render` to a helper and back.
declare const forAny: RenderProp<CardState>
declare const forButton: RenderProp<CardState, "button">
const toButton: RenderProp<CardState, "button"> = forAny
const toAny: RenderProp<CardState> = forButton
void toButton
void toAny
// @ts-expect-error A button's `render` isn't a `div`'s.
const toDiv: RenderProp<CardState, "div"> = forButton
void toDiv
// @ts-expect-error It is an element or a function.
const text: RenderProp = "div"
void text
function withBadge<State>(render: RenderProp<State> | undefined, badge: OctaneNode): RenderProp<State> {
  return (props, state) => [renderElement("span", props, render, state), badge]
}
;<RaisedCard render={withBadge<CardState>(undefined, "new")} />

// `mergeProps` takes props of any element and returns them by name, which
// an element takes spread.
function Merged(props: PartProps<"button">) {
  const merged = mergeProps(props, { className: "merged" }, { onClick: (event: Event) => event.preventDefault() })
  const names: unknown = merged.className
  void names
  // @ts-expect-error By name, a value has no known type.
  merged.className.length
  return <button {...merged} />
}
void Merged
// @ts-expect-error Each source is an object of props.
mergeProps("className")
