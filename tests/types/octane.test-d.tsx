// Type tests for what Octane's elements take that React's don't, which
// upstream's types have no opinion on: `class` beside `className`, both
// clsx-style, `style` as text, a ref that is a list of refs, handlers that
// receive the browser's own events, and a `render` function whose props are
// those of the part's tag.
//
// Compiled by `pnpm typecheck`, never run.
import { useRef, type ClassValue, type CSSProperties } from "octane"
import { createParts } from "../../src/primitive"
import { list } from "./primitives"

const List = createParts(list, {
  root: "ul",
  item: "li",
  handle: "button",
  "drag-preview": "div",
})

// `class` and `className` both take what Octane composes into class names.
;<List.Item value="a" class="row" />
;<List.Item value="a" className="row" />
;<List.Item value="a" class="row" className={["wide", { dense: true }, null, 0, false]} />
;<List.Item value="a" class={{ row: true, dense: 1 > 0 }} />
// @ts-expect-error A symbol isn't a class name.
;<List.Item value="a" class={Symbol("row")} />
// @ts-expect-error Nor is one in `className`.
;<List.Item value="a" className={Symbol("row")} />

// `style` is an object, with either spelling of a property, or text.
;<List.Item value="a" style={{ color: "red", backgroundColor: "blue" }} />
;<List.Item value="a" style={{ "background-color": "blue" }} />
;<List.Item value="a" style="color:red" />
// @ts-expect-error `colour` isn't a property.
;<List.Item value="a" style={{ colour: "red" }} />
// @ts-expect-error A number isn't a style.
;<List.Item value="a" style={1} />

// A ref is a callback, an object, or a list of them, for the tag's element.
function Refs() {
  const item = useRef<HTMLLIElement | null>(null)
  const button = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <List.Item value="a" ref={item} />
      <List.Item value="a" ref={(el) => void el?.value} />
      <List.Item value="a" ref={[item, (el) => void el?.value, undefined]} />
      <List.Handle item="a" ref={[button, [(el) => void el?.form]]} />
      {/* @ts-expect-error A list item's ref doesn't hold a button. */}
      <List.Item value="a" ref={button} />
      {/* @ts-expect-error Not in a list either. */}
      <List.Item value="a" ref={[item, button]} />
    </>
  )
}
void Refs

// Handlers receive the browser's own events, with the part's element as
// `currentTarget`. Text input is `onInput`.
;<List.Handle
  item="a"
  onClick={(event) => {
    const native: MouseEvent = event
    const form: HTMLFormElement | null = event.currentTarget.form
    void native
    void form
  }}
  onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
  onFocus={(event) => event.relatedTarget}
  onInput={(event) => event.currentTarget.value}
/>
// @ts-expect-error There is no synthetic event to hold a `nativeEvent`.
;<List.Handle item="a" onClick={(event) => event.nativeEvent} />
// @ts-expect-error Nor to `persist()`.
;<List.Handle item="a" onKeyDown={(event) => event.persist()} />
// @ts-expect-error A click isn't a key press.
;<List.Handle item="a" onClick={(event) => event.key} />
// @ts-expect-error A list item is not a button.
;<List.Item value="a" onClick={(event) => event.currentTarget.form} />

// Octane takes an attribute's own lowercase name too.
;<List.Handle item="a" tabindex="0" tabIndex={0} formaction="/save" />
;<List.Root aria-label="Tracks" role="listbox" />

// A `render` function gets the props of the part's tag, as the part merged
// them: class names under `className`, and `style` as an object.
;<List.Handle
  item="a"
  render={(props) => {
    const type: "submit" | "reset" | "button" | undefined = props.type
    const names: ClassValue = props.className
    const style: CSSProperties | undefined = props.style
    // @ts-expect-error The part's `class` arrives as `className`.
    props.class
    // @ts-expect-error A button has no `href`.
    props.href
    void type
    void names
    void style
    return <button {...props} />
  }}
/>
;<List.Item value="a" render={(props, state) => <li {...props} value={state.index} />} />
// @ts-expect-error A list item's props aren't a button's: its handlers expect a list item.
;<List.Item value="a" render={(props) => <button {...props} />} />
// Another element takes the props as an element, which the part clones
// them into, or as a function of props by name.
;<List.Item value="a" render={<a href="#a" />} />
;<List.Item value="a" render={(props: Record<string, unknown>) => <a {...props} href="#a" />} />
// @ts-expect-error `render` is an element or a function, not a tag name.
;<List.Item value="a" render="a" />
// @ts-expect-error Its function takes the props and the state, and no more.
;<List.Item value="a" render={(props, state, more: string) => more} />
