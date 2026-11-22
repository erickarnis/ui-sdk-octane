/** @jsxImportSource octane */
// What a root learns from the children the app gave it. Ported from
// @ui-sdk/react's children. Octane hands a component the children of a
// template as a compiled block, which can't be read, so a root that reads
// them is marked `descriptorChildren` where it's defined, and a block that
// arrives anyway reads as nothing: the content then tells its root as it
// mounts, as it does inside a component of the app's own.
import {
  Children,
  createContext,
  isChildrenBlock,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type OctaneNode,
} from "octane"
import { isProps, type PropValue } from "../render-element.js"

// The children the markup shows, one level down.
function childrenOf(children: OctaneNode): readonly OctaneNode[] {
  if (isChildrenBlock(children)) return []
  const listed: unknown = Children.toArray(children)
  return Array.isArray(listed) ? listed : []
}

// An element's props, by name.
function propsOf(element: { props: unknown }) {
  const props: unknown = element.props
  return isProps(props) ? props : {}
}

// Whether an element of this type is among the children, at any depth the
// markup shows: inside fragments and wrapping elements too. A root that
// renders its own part when the app gives none checks here, so a part placed
// in the markup never renders a second one, not even for a frame.
function hasChild(children: OctaneNode, type: PropValue): boolean {
  for (const child of childrenOf(children)) {
    if (
      isValidElement(child) &&
      (child.type === type || hasChild(propsOf(child).children, type))
    )
      return true
  }
  return false
}

// Where a root's content part says it's there. `hasChild` can't see a part
// inside a component of the app's own, like a styled `SelectContent`, so the
// part tells its root when it mounts, before the page paints.
const PlacedContext = createContext<(() => () => void) | null>(null)

function usePlacedContent(wanted: boolean) {
  const [count, setCount] = useState(0)
  const register = useCallback(() => {
    setCount((count) => count + 1)
    return () => {
      setCount((count) => count - 1)
    }
  }, [])
  return [count > 0, wanted ? register : null] as const
}

// A context is its own provider in Octane.
const Placed = PlacedContext

function usePlaceContent() {
  const register = useContext(PlacedContext)
  useLayoutEffect(() => register?.(), [register])
}

const notLabelKey = Symbol.for("ui-sdk.not-label")

// Parts marked so, by the key above.
const notLabels = new WeakSet<object>()

// Marks a part inside an item that isn't its label, like an icon.
function notLabel<Part extends object>(part: Part) {
  notLabels.add(part)
  Object.defineProperty(part, notLabelKey, { value: true })
  return part
}

type Learned = { value: PropValue; label: string }

// Teaches a list the labels its children give its values, before the items
// that would mount: a closed select shows its value's label from the first
// render on.
function learnLabels(
  internal: {
    keyOf: (value: PropValue) => string
    learnLabels: (find: (keys: ReadonlySet<string>) => Learned[]) => void
  },
  children: OctaneNode,
  skip: ReadonlySet<PropValue>
) {
  internal.learnLabels((keys) => {
    const found: Learned[] = []
    const text = (node: OctaneNode): string => {
      if (typeof node === "string" || typeof node === "number")
        return String(node)
      if (Array.isArray(node)) return node.map(text).join("")
      if (!isValidElement(node)) return ""
      const type: unknown = node.type
      const props = propsOf(node)
      const decoration =
        skip.has(type) ||
        (typeof type === "function" && notLabels.has(type)) ||
        props["aria-hidden"]
      return decoration ? "" : text(props.children)
    }
    const visit = (node: OctaneNode) => {
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      if (!isValidElement(node)) return
      const { value, label, children } = propsOf(node)
      // An element, like an `<input>` with its own `value`, is never an item.
      if (
        value === undefined ||
        typeof node.type === "string" ||
        !keys.has(internal.keyOf(value))
      ) {
        visit(children)
        return
      }
      // Whitespace collapsed, as an item's label reads once it mounts.
      const shown =
        typeof label === "string"
          ? label
          : text(children).replace(/\s+/g, " ").trim()
      if (shown) found.push({ value, label: shown })
    }
    visit(isChildrenBlock(children) ? null : children)
    return found
  })
}

export {
  hasChild,
  learnLabels,
  notLabel,
  Placed,
  usePlaceContent,
  usePlacedContent,
}
