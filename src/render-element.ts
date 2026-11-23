// Renders an element with no primitive behind it, and merges props and refs.
// Ported from @ui-sdk/react's render-element (Apache-2.0) for Octane: handlers
// receive the browser's own events, a ref may be a list of refs, and children
// written in a template arrive as a compiled block rather than a function.
import {
  cloneElement,
  createElement,
  isChildrenBlock,
  isValidElement,
  type ClassValue,
  type ComponentProps,
  type CSSProperties,
  type ElementDescriptor,
  type Octane,
  type OctaneNode,
} from "octane"

/** What a prop may hold: each element type, not this file, says what. */
type PropValue = unknown
/**
 * Props on their way to an element, by name. The adapter passes them between
 * the app, core and Octane without reading most of them.
 */
// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- element props are open by nature: the adapter moves them between the app, core and Octane without reading most of them
type Props = Record<string, PropValue>

type Handler = (event: Event) => void
// What a class name, style or children function makes of a part's state.
type StateFunction = (state: object) => ClassValue | CSSProperties | OctaneNode

const isHandler = (value: unknown): value is Handler =>
  typeof value === "function"
const isStateFunction = (value: unknown): value is StateFunction =>
  typeof value === "function" && !isChildrenBlock(value)
const isKey = (value: unknown): value is object =>
  (typeof value === "object" && value !== null) || typeof value === "function"
const isProps = (value: unknown): value is Props =>
  typeof value === "object" && value !== null

// "position:absolute;margin:-1px" becomes { position: "absolute", margin: "-1px" }.
// Parts render the same few styles again and again, so each text is parsed
// once. The cache empties when it fills, since a drag writes a new position
// on every move.
const styles = new Map<string, CSSProperties>()

// The declarations in a style's text. A `;` inside brackets or quotes, as in
// `url(data:image/png;base64,...)`, is part of a value.
function declarations(css: string) {
  const found: string[] = []
  let start = 0
  let depth = 0
  let quote = ""
  for (let index = 0; index < css.length; index++) {
    const char = css.charAt(index)
    if (quote) {
      if (char === "\\") index++
      else if (char === quote) quote = ""
    } else if (char === '"' || char === "'") quote = char
    else if (char === "(") depth++
    else if (char === ")") depth = Math.max(0, depth - 1)
    else if (char === ";" && depth === 0) {
      found.push(css.slice(start, index))
      start = index + 1
    }
  }
  found.push(css.slice(start))
  return found
}

function styleObject(css: string): CSSProperties {
  const cached = styles.get(css)
  if (cached) return cached
  const style: Record<string, string> = {}
  for (const declaration of declarations(css)) {
    const index = declaration.indexOf(":")
    if (index === -1) continue
    const name = declaration.slice(0, index).trim()
    style[
      name.startsWith("--")
        ? name
        : name.replace(/-(\w)/g, (_, char: string) => char.toUpperCase())
    ] = declaration.slice(index + 1).trim()
  }
  if (styles.size >= 500) styles.clear()
  styles.set(css, style)
  return style
}

// A style as an object, whether the app wrote text or an object.
function plainStyle(style: PropValue): object {
  if (typeof style === "string") return styleObject(style)
  return isProps(style) ? style : {}
}

// Class names and styles combine, and a function of the part's state stays a
// function, so a part's own value never drops the app's function.
function combine<Joined>(
  earlier: PropValue,
  later: PropValue,
  join: (earlier: PropValue, later: PropValue) => Joined
) {
  if (!isStateFunction(earlier) && !isStateFunction(later))
    return join(earlier, later)
  const resolve = (value: PropValue, state: object) =>
    isStateFunction(value) ? value(state) : value
  return (state: object) => join(resolve(earlier, state), resolve(later, state))
}

// Octane composes a list of class values itself.
const joinClasses = (earlier: PropValue, later: PropValue) => [earlier, later]
const joinStyles = (earlier: PropValue, later: PropValue) => ({
  ...plainStyle(earlier),
  ...plainStyle(later),
})

// One list for the same pair of refs, so Octane does not detach and attach
// the element again on every render.
const mergedRefs = new WeakMap<object, WeakMap<object, readonly unknown[]>>()

function mergeRefs(a: PropValue, b: PropValue) {
  if (!isKey(a) || !isKey(b)) return a ?? b
  let inner = mergedRefs.get(a)
  if (!inner) mergedRefs.set(a, (inner = new WeakMap()))
  let merged = inner.get(b)
  if (!merged) inner.set(b, (merged = [a, b]))
  return merged
}

// Runs a handler and says whether it called preventDefault(). The browser
// records that call only on an event it can cancel, and `input`, `focusin`
// and `focusout` are not, so for those the call is watched for the length of
// the handler. React's own events record it on every event.
function prevents(handler: Handler, event: Event) {
  if (event.cancelable) {
    handler(event)
    return event.defaultPrevented
  }
  let called = false
  event.preventDefault = () => {
    called = true
  }
  try {
    handler(event)
  } finally {
    // Back to the browser's own method, which the event inherits.
    Reflect.deleteProperty(event, "preventDefault")
  }
  return called
}

// Octane takes an attribute in the DOM's spelling or in React's, and the app
// may write either. Props merge under React's, which the parts use, so a
// part's `tabIndex` and the app's `tabindex` are one prop, not two that both
// reach the element.
const spellings: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  inputmode: "inputMode",
  enterkeyhint: "enterKeyHint",
  autocomplete: "autoComplete",
  autocapitalize: "autoCapitalize",
  autocorrect: "autoCorrect",
  spellcheck: "spellCheck",
  contenteditable: "contentEditable",
  maxlength: "maxLength",
  minlength: "minLength",
}

/**
 * Later props win, except where they combine: class names, style and ref, and
 * event handlers, where the later one runs first and can call
 * preventDefault() to skip the earlier. Undefined never replaces a value.
 * An attribute in the DOM's spelling is read as its camel-case prop, like
 * `class` as `className` and `tabindex` as `tabIndex`.
 */
function mergeProps(...sources: readonly Props[]) {
  const result: Props = {}
  for (const source of sources)
    for (const name in source) mergeProp(result, name, source[name])
  return result
}

// Merges one prop into `result` as `mergeProps` does, for a caller that
// builds its props in one object rather than merging several it made first.
function mergeProp(result: Props, name: string, value: PropValue) {
  if (value === undefined) return
  const key = spellings[name] ?? name
  const earlier = result[key]
  if (earlier === undefined) {
    result[key] = value
  } else if (key === "className" && earlier) {
    result[key] = combine(earlier, value, joinClasses)
  } else if (key === "style" && earlier) {
    result[key] = combine(earlier, value, joinStyles)
  } else if (key === "ref" && earlier) {
    result[key] = mergeRefs(earlier, value)
  } else if (/^on[A-Z]/.test(key) && isHandler(earlier) && isHandler(value)) {
    result[key] = (event: Event) => {
      if (!prevents(value, event)) earlier(event)
    }
  } else {
    result[key] = value
  }
}

type Tag = keyof Octane.JSX.IntrinsicElements

/**
 * The props a `render` function for a `T` receives: the element's own, as
 * the part merged them. Class names arrive under `className`, never `class`.
 * The functions of state have run by then, so `style` is an object, even
 * when the app wrote text, and `children` is content.
 */
type RenderedProps<T extends Tag> = Omit<
  ComponentProps<T>,
  "class" | "className" | "style" | "children"
> & {
  className?: ClassValue
  style?: CSSProperties | undefined
  children?: OctaneNode
}

/**
 * A part's `render` prop: an element that receives the part's props, or a
 * function of the props and the part's state that returns one. `T` is the
 * tag whose props the function receives. Without it they are props by name,
 * for a function that renders whichever element it is given.
 */
type RenderProp<State = {}, T extends Tag | undefined = undefined> =
  ElementDescriptor | RenderFunction<State, T>
// Upstream's function takes `Record<string, any>`, which fits every element.
// Here a tag's props and props by name are different types, and a wrapper
// passes a `render` between a part of each, so the function is declared as
// a method, whose parameters TypeScript compares both ways.
type RenderFunction<State, T extends Tag | undefined> = {
  render(
    props: T extends Tag ? RenderedProps<T> : Props,
    state: State
  ): OctaneNode
}["render"]

/**
 * Renders an element that takes a `render` prop: the tag, or the element or
 * function passed as `render`, which gets the props. Class name, style and
 * children functions resolve against `state`. Parts of a primitive use
 * `createParts` or `usePart`.
 */
function renderElement<T extends Tag>(
  tag: T,
  props: Props,
  render?: RenderProp<{}, T>
): OctaneNode
function renderElement<T extends Tag, State>(
  tag: T,
  props: Props,
  render: RenderProp<State, T> | undefined,
  state: State
): OctaneNode
function renderElement(
  tag: string,
  props: Props,
  render?: RenderProp
): OctaneNode
function renderElement<State>(
  tag: string,
  props: Props,
  render: RenderProp<State> | undefined,
  state: State
): OctaneNode
function renderElement(
  tag: string,
  props: Props,
  render?: RenderProp,
  state: object = {}
): OctaneNode {
  return renderOwn(tag, { ...props }, render, state)
}

const stateKeys = ["className", "style", "children"] as const

// `renderElement` for props the caller made for this render alone, which it
// resolves in place instead of copying.
function renderOwn(
  tag: string,
  resolved: Props,
  render: RenderProp | undefined,
  state: object
): OctaneNode {
  for (const key of stateKeys) {
    const value = resolved[key]
    if (isStateFunction(value)) resolved[key] = value(state)
  }
  if (typeof resolved.style === "string")
    resolved.style = styleObject(resolved.style)
  if (typeof render === "function") return render(resolved, state)
  if (isValidElement(render)) {
    // The element's own props merge in: its handlers run before the part's.
    const own: unknown = render.props
    return cloneElement(render, mergeProps(resolved, isProps(own) ? own : {}))
  }
  return createElement(tag, resolved)
}

export {
  isKey,
  isProps,
  mergeProp,
  mergeProps,
  mergeRefs,
  renderElement,
  renderOwn,
  spellings,
  styleObject,
  type PropValue,
  type Props,
  type RenderProp,
  type RenderedProps,
  type Tag,
}
