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
  type CSSProperties,
  type ElementDescriptor,
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

function styleObject(css: string): CSSProperties {
  const cached = styles.get(css)
  if (cached) return cached
  const style: Record<string, string> = {}
  for (const declaration of css.split(";")) {
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

/**
 * Later props win, except where they combine: class names, style and ref, and
 * event handlers, where the later one runs first and can call
 * preventDefault() to skip the earlier. Undefined never replaces a value.
 * `class` is read as `className`.
 */
function mergeProps(...sources: readonly Props[]) {
  const result: Props = {}
  for (const source of sources) {
    for (const name in source) {
      const value = source[name]
      if (value === undefined) continue
      const key = name === "class" ? "className" : name
      const earlier = result[key]
      if (earlier === undefined) {
        result[key] = value
      } else if (key === "className" && earlier) {
        result[key] = combine(earlier, value, joinClasses)
      } else if (key === "style" && earlier) {
        result[key] = combine(earlier, value, joinStyles)
      } else if (key === "ref" && earlier) {
        result[key] = mergeRefs(earlier, value)
      } else if (
        /^on[A-Z]/.test(key) &&
        isHandler(earlier) &&
        isHandler(value)
      ) {
        result[key] = (event: Event) => {
          value(event)
          if (!event.defaultPrevented) earlier(event)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * A part's `render` prop: an element that receives the part's props, or a
 * function of the props and the part's state that returns one.
 */
type RenderProp<State extends object = object> =
  ElementDescriptor | RenderFunction<State>
interface RenderFunction<State extends object> {
  (props: Props, state: State): OctaneNode
}

/**
 * Renders an element that takes a `render` prop: the tag, or the element or
 * function passed as `render`, which gets the props. Class name, style and
 * children functions resolve against `state`. Parts of a primitive use
 * `createParts` or `usePart`.
 */
function renderElement(tag: string, props: Props): OctaneNode
function renderElement<State extends object>(
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
  const resolved = { ...props }
  for (const key of ["className", "style", "children"]) {
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
  mergeProps,
  mergeRefs,
  renderElement,
  styleObject,
  type PropValue,
  type Props,
  type RenderProp,
}
