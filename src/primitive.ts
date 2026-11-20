/** @jsxImportSource octane */
// The Octane adapter for UI SDK (@ui-sdk/core): renders a primitive's parts as
// Octane components, as @ui-sdk/react does for React. Ported from that
// package's use-primitive (Apache-2.0, 0.1.0-beta.13), which this file follows
// in the same order so the two read side by side. It leaves out what only
// that package's own components use (options that read another instance, and
// the helpers for their markup). What differs is Octane's:
//
// - Hooks are keyed by call site, so a part makes one id and derives the rest
//   where React calls useId in a loop, and an effect that runs after every
//   render says so with `null`.
// - Handlers receive the browser's own events, so core's handlers attach as
//   they are, and `input` maps to onInput.
// - A context is its own provider, and a ref may be a list of refs.
//
// The flags the React adapter keeps for an instance's life and a part's
// element are named states here (`Life`, and `element` in `heldRef`).
//
// It builds on `@ui-sdk/core/renderer`, which core keeps for adapters and may
// change in any release: pin @ui-sdk/core exactly and re-read this file
// against the React adapter when raising it. Primitives with type parameters
// render, but their parts are typed without them.
import type {
  Attrs,
  OptionsOf,
  Part,
  Primitive,
  PrimitiveInstance,
  PropSpec,
  PropsOf,
  SlotName,
  StateOf,
  TypesOf,
} from "@ui-sdk/core"
// A namespace, so every read of core stays a member call: Octane's compiler
// may reuse the result of a call to an imported function while its arguments
// are unchanged, and these read state that moves under the same instance.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ClassValue,
  type ComponentProps,
  type Context,
  type CSSProperties,
  type Octane,
  type OctaneNode,
} from "octane"
import {
  isProps,
  mergeProps,
  renderElement,
  styleObject,
  type PropValue,
  type Props,
  type RenderProp,
} from "./render-element"

// Names Octane spells in camel case, by their lowercase DOM name, like
// `tabindex: "tabIndex"`, with `prefix` before each.
const camelCase = (names: string, prefix = "") =>
  Object.fromEntries(
    names.split(" ").map((name) => [name.toLowerCase(), prefix + name])
  )

// The attribute translations: names the app's own props spell in camel case,
// so a part's attribute and the app's prop are one key when they merge, and
// the `checked` attribute, which is the default checkedness in HTML.
const propNames: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  checked: "defaultChecked",
  ...camelCase(
    "tabIndex readOnly inputMode enterKeyHint autoComplete autoCapitalize autoCorrect spellCheck contentEditable maxLength minLength"
  ),
}
const booleans = new Set([
  "hidden",
  "disabled",
  "readonly",
  "required",
  "inert",
  "checked",
  "multiple",
])

// DOM event names to Octane prop names. onFocus and onBlur are the bubbling
// focusin and focusout, as in React.
const eventProps: Record<string, string> = {
  ...camelCase(
    "Click KeyDown KeyUp ContextMenu PointerDown MouseDown PointerUp PointerMove Input Submit",
    "on"
  ),
  dblclick: "onDoubleClick",
  focusin: "onFocus",
  focusout: "onBlur",
}

// Every other type is the element's own listener, which core attaches, so a
// slot's `on.focus` or `on.wheel` works like `on.keydown`.
const host = {
  by: "framework",
  attaches: Object.keys(eventProps),
} as const

function toHostProps(attrs: Attrs) {
  const props: Props = {}
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) continue
    props[propNames[name] ?? name] = booleans.has(name)
      ? true
      : name === "style"
        ? styleObject(value)
        : value
  }
  return props
}

// A bag of props or options, whatever its type, as one the adapter can read
// by name.
const bag = (value: object | undefined): Props => ({ ...value })

/**
 * What `usePrimitive` returns, and what a component's context holds: one
 * object for the instance's life.
 */
type PrimitiveHandle<P extends Primitive> = {
  /** The primitive it's an instance of. */
  readonly primitive: P
  /** The core instance `usePrimitive` made, with its `get()`, `part()` and `api`. In render, read `state` instead of its `get()`, which shows only what has committed. */
  readonly instance: ReturnType<P>
  /** The state this render shows. Reading it doesn't subscribe; a part's `render` and class name functions get the state they render. */
  readonly state: TypesOf<P>["state"]
  /** The methods its definition declares, like Tabs' `setValue`. */
  readonly api: TypesOf<P>["api"]
}
type Handle = PrimitiveHandle<Primitive>

// A render's options the instance doesn't have yet, the state they make over
// `base`, the instance's state they were last applied to, and the parts that
// rendered with them and haven't committed yet.
type Preview = {
  options: Props
  base: object
  state: object | undefined
  pending: Set<object>
}

// Each previewing handle's preview, from its render until that render commits
// and hands the options over. Kept off the handle so its public type shows
// only what consumers read.
const previews = new WeakMap<object, Preview>()

// The preview whose options are being handed over right now. Its pending
// parts skip the change that makes, since each commits right after and
// checks then. A root's own part commits after the root, so it would
// otherwise render twice for every new option.
let handing: Preview | undefined

// Hands a render's options over as it commits. From here the instance has
// what the preview showed, so the handle reads the instance again.
function handOver(handle: Handle, options: Props) {
  const preview = previews.get(handle)
  previews.delete(handle)
  const outer = handing
  handing = preview
  try {
    handle.instance.setOptions(options)
  } finally {
    handing = outer
  }
}

// The state a handle's render shows: its preview until it's handed over, made
// again whenever the instance's state moves on, like a resizable measuring
// its panels, so it never shows state older than the instance's, and options
// still waiting for a commit land on the newest state.
function stateIn(handle: object, instance: PrimitiveInstance) {
  const current = instance.get()
  const preview = previews.get(handle)
  if (!preview) return current
  if (preview.base !== current) {
    preview.base = current
    preview.state = instance.preview(preview.options)
  }
  return preview.state ?? current
}

// Reads what a handle's render shows, given its state, with the api reading
// that state too, like a list's items or a slot's selected item, since the
// api reads the instance's own. The api reads the parts in `around` with the
// props this render gives them, like a radio group's new value.
function readIn<T>(
  handle: Handle,
  read: (state: object) => T,
  around?: Record<string, Props>
) {
  const state = handle.state
  if (state === handle.instance.get() && !around) return read(state)
  return handle.instance.view(state, () => read(state), around)
}

function makeHandle(
  primitive: Primitive,
  instance: PrimitiveInstance,
  preview?: Preview
) {
  const handle: Handle = {
    primitive,
    instance,
    get state() {
      return stateIn(handle, instance)
    },
    // Read when used, since reading it wakes an asleep instance.
    get api() {
      return instance.api
    },
  }
  if (preview) previews.set(handle, preview)
  return handle
}

// One element of each instance's that's in the page, as its parts commit.
// Octane keeps it there while hiding a component, and removes it with it.
const anchors = new WeakMap<PrimitiveInstance, Element>()
const inPage = (instance: PrimitiveInstance) =>
  !!anchors.get(instance)?.isConnected

// Where a component's instance is in its life, one per `usePrimitive` call.
// Hidden or gone, the instance lets go of what it holds outside itself, like
// its controller, and keeps its state for <Activity> showing it again.
// Hiding is told from removing only through the page:
//
// - rendered: made, and its component hasn't committed yet.
// - mounted: its component is in the tree.
// - leaving: its effect cleaned up. A microtask decides what that was, so an
//   unmount and remount in one go stays mounted.
// - hidden: released, with an element still in the page. It is destroyed
//   once that element leaves, settling a pending controller `open()`.
// - unowned: released with no element in the page. It is destroyed once
//   Octane lets go of the component, whose `life` goes with it.
// - destroyed: gone. Shown again, the component makes a new instance that
//   starts where this one was.
type Life = {
  at: "rendered" | "mounted" | "leaving" | "hidden" | "unowned" | "destroyed"
}

const owners =
  typeof FinalizationRegistry === "undefined"
    ? undefined
    : new FinalizationRegistry<PrimitiveInstance>((instance) => {
        instance.destroy()
      })

// The hidden instances, each with its life, swept while there are any.
const hidden = new Map<PrimitiveInstance, Life>()
let sweeping: ReturnType<typeof setInterval> | undefined

function destroy(life: Life, instance: PrimitiveInstance) {
  life.at = "destroyed"
  instance.destroy()
}

function hide(life: Life, instance: PrimitiveInstance) {
  life.at = "hidden"
  hidden.set(instance, life)
  sweeping ??= setInterval(() => {
    for (const [waiting, its] of hidden) {
      if (inPage(waiting)) continue
      hidden.delete(waiting)
      destroy(its, waiting)
    }
    if (hidden.size) return
    clearInterval(sweeping)
    sweeping = undefined
  }, 1000)
}

// The component is in the tree: whatever was waiting to destroy the instance
// stops. True when it was already destroyed, so the component makes another.
function mount(life: Life, instance: PrimitiveInstance) {
  const from = life.at
  if (from === "hidden") hidden.delete(instance)
  if (from === "unowned") owners?.unregister(life)
  life.at = "mounted"
  return from === "destroyed"
}

// A microtask after the effect cleaned up: still leaving, the component was
// hidden or removed.
function leave(life: Life, instance: PrimitiveInstance) {
  if (life.at !== "leaving") return
  core.release(instance)
  if (!anchors.has(instance)) {
    life.at = "unowned"
    owners?.register(life, instance, life)
  } else if (inPage(instance)) hide(life, instance)
  else destroy(life, instance)
}

// A destroyed instance's state, as the defaults a new one starts from, for
// each option with a default the parent didn't control.
function carried(
  primitive: Primitive,
  instance: PrimitiveInstance,
  options: Props
) {
  const schema = core.schemaOf(primitive).options
  const state = bag(instance.get())
  const defaults: Props = {}
  for (const key in state) {
    const fallback = `default${key.charAt(0).toUpperCase()}${key.slice(1)}`
    if (fallback in schema && options[key] === undefined)
      defaults[fallback] = state[key]
  }
  return defaults
}

function useHandle(primitive: Primitive, options: Props): Handle {
  // Prefixed so a page using ui-sdk is recognizable from its HTML. Part ids
  // stay unprefixed, since some are keys, like saved resizable layouts.
  const id = `ui-sdk-${useId()}`
  // Without its controller until it commits, so a render that is thrown
  // away never takes the controller from the instance on the page.
  const create = (from: Props = {}) =>
    core.unwatched(() =>
      primitive({ ...options, ...from, controller: undefined, id })
    )
  // Kept once it commits: only then do the agent and `observe` hear it, its
  // controller attach and its work outside itself start.
  const [instance, setInstance] = useState(() => create())
  useLayoutEffect(() => {
    core.keep(instance)
  }, [instance])

  // The state this render's options make, while the instance doesn't have
  // them yet: the parts inside render the new value in the same pass, and
  // the instance takes it when that pass commits.
  const next = { ...options, id }
  const base = instance.get()
  const state = instance.preview(next)
  // One object for the instance's life, so context consumers never re-render
  // because of it. Parts subscribe to what they render through usePart.
  const stable = useMemo(() => makeHandle(primitive, instance), [instance])
  const handle = state
    ? makeHandle(primitive, instance, {
        options: next,
        base,
        state,
        pending: new Set(),
      })
    : stable

  // Keeps callbacks fresh and syncs controlled options.
  useLayoutEffect(() => {
    handOver(handle, next)
  }, null)

  const life = useRef<Life>({ at: "rendered" })
  useEffect(() => {
    const own = life.current
    if (mount(own, instance))
      setInstance(create(carried(primitive, instance, options)))
    return () => {
      own.at = "leaving"
      queueMicrotask(() => {
        leave(own, instance)
      })
    }
  }, [instance])

  // Once every part in the commit bound: their store writes land together.
  useEffect(() => {
    core.runBindWrites()
  }, null)

  return handle
}

/**
 * Creates an instance of a primitive for this component, keeps its options
 * current on every render, and destroys it when the component leaves. Render
 * its root with `usePart`, which shares the instance with the parts inside.
 *
 * @example
 * function ConfirmButton({ onConfirm, ...props }: PartProps<"button"> & { onConfirm?: () => void }) {
 *   const button = usePrimitive(confirmButton, { onConfirm })
 *   return usePart(button, "root", {}, props, "button")
 * }
 */
function usePrimitive<P extends Primitive>(
  primitive: P,
  options: OptionsOf<P>
): PrimitiveHandle<P>
function usePrimitive(primitive: Primitive, options: object) {
  return useHandle(primitive, bag(options))
}

const heldRefs = new WeakMap<Part, (el: HTMLElement | null) => void>()

// Octane detaches and attaches an element again when its ref changes, like an
// inline callback ref the app passes, so a part lets go of its element a
// microtask later, unless it attached again by then.
function heldRef(part: Part) {
  const existing = heldRefs.get(part)
  if (existing) return existing
  const bindTo = core.ref(part, host)
  let element: "attached" | "detaching" | "detached" = "detached"
  const held = (el: HTMLElement | null) => {
    if (el) {
      element = "attached"
      bindTo(el)
      return
    }
    element = "detaching"
    queueMicrotask(() => {
      if (element !== "detaching") return
      element = "detached"
      bindTo(null)
    })
  }
  heldRefs.set(part, held)
  return held
}

// The slot's attributes win over the app's props, but for an `id` and what
// `yieldToAuthor` leaves to the app. The app's handlers run first and can
// call preventDefault() to skip the built-in behavior.
function elementProps(part: Part, props: Props, user: Props, state: object) {
  core.takeOwnId(part, user.id)
  const handlers: Props = {}
  for (const [type, handler] of Object.entries(core.handlers(part))) {
    const prop = eventProps[type]
    if (prop) handlers[prop] = handler
  }
  const own = core.yieldToAuthor(
    core.attrs(part, props, state),
    (name) =>
      user[propNames[name] ?? name] != null ||
      (name === "class" && user.class != null)
  )
  return mergeProps(handlers, user, toHostProps(own), {
    id: user.id,
    ref: heldRef(part),
  })
}

// Attributes in `skip` may differ.
function sameAttrs(a: Attrs, b: Attrs, skip: readonly string[] = []) {
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key] || skip.includes(key))
  )
}

// Each instance's mounted parts, to check again when a part commits new values.
const rechecks = new WeakMap<PrimitiveInstance, Set<() => void>>()

// Whether committing `after` changes a value other parts may read. Callbacks
// are new on most renders, so a new one doesn't count.
function changesValues(before: Props, after: Props) {
  for (const key in { ...before, ...after }) {
    if (typeof before[key] === "function" && typeof after[key] === "function")
      continue
    if (!core.sameValue(before[key], after[key])) return true
  }
  return false
}

// A slot's state as this render shows it, by name.
function slotState(part: Part, props: Props, showing: object) {
  const state: unknown = core.partState(part, props, showing)
  return isProps(state) ? state : {}
}

// The props a part last committed.
function committedProps(part: Part) {
  const props: unknown = part.props
  return isProps(props) ? props : {}
}

/**
 * A part's state for `render` and state-based class names, and its
 * subscription to the instance. A part re-renders only when its attributes or
 * presence change, or a state key its render function read changes. Live
 * state, like the highlighted item, changes no attributes, so parts that never
 * read it never re-render for it. Core writes a slot's `direct` attributes to
 * the element itself, so a change to only those re-renders nothing either.
 */
function usePartState(
  handle: Handle,
  name: string,
  props: Props,
  around: Record<string, Props> | undefined
) {
  const { instance } = handle
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  // Rendering may be thrown away, so the part's props take effect, for its
  // handlers and its `onProps` work, once they commit.
  const part = instance.part(name, props, true)
  const rendered = readIn(
    handle,
    (showing) => ({
      handle,
      around,
      props,
      snapshot: slotState(part, props, showing),
      // The keys this render read, filled in as it reads them.
      read: new Set<string>(),
      attrs: core.attrs(part, props, showing),
      present: core.present(part, props, showing),
      version: core.renderVersion(instance),
    }),
    around
  )
  const state = new Proxy(rendered.snapshot, {
    get(target, key) {
      if (typeof key !== "string") return undefined
      rendered.read.add(key)
      return target[key]
    },
  })

  // What the last committed render showed. The listener compares it with
  // what that render's handle and the parts around it show now, so the part
  // subscribes once, not on every render, and a render and its check never
  // disagree. It reads with the committed props, not those of a render that
  // was thrown away since.
  const last = useRef(rendered)
  const preview = previews.get(handle)
  preview?.pending.add(last)
  // `full` compares the attributes core writes itself too, after a commit,
  // whose render may have read state older than what core last wrote, and
  // `again` compares them though the state didn't change, after another
  // part's props did.
  const check = useCallback(
    (full: boolean, again = false) => {
      const shown = last.current
      const outdated = readIn(
        shown.handle,
        (now) => {
          if (shown.read.size) {
            const next = slotState(part, shown.props, now)
            for (const key of shown.read) {
              if (core.sameSlotState(next[key], shown.snapshot[key])) continue
              shown.snapshot = next
              return true
            }
          }
          // Presence may read live state, which changes no version, so it is
          // checked on every change.
          const shows = core.present(part, shown.props, now)
          if (shows !== shown.present) return true
          if (core.renderVersion(instance) === shown.version && !again)
            return false
          shown.version = core.renderVersion(instance)
          // A part that isn't in the page has no attributes to keep current,
          // like a closed popup's content learning its trigger's id.
          return (
            shows &&
            !sameAttrs(
              core.attrs(part, shown.props, now),
              shown.attrs,
              full ? undefined : core.directNames(part)
            )
          )
        },
        shown.around
      )
      if (outdated) rerender()
    },
    [instance, part]
  )

  useLayoutEffect(() => {
    const before = committedProps(part)
    const changed = before !== props && changesValues(before, props)
    core.commit(part, props)
    preview?.pending.delete(last)
    if (part.el && !inPage(instance)) anchors.set(instance, part.el)
    last.current = rendered
    // Changes between the render and now, like another part binding, count too.
    check(true)
    // Children commit first, and so do parts elsewhere that read this one's
    // committed props, which check again now.
    if (changed)
      rechecks.get(instance)?.forEach((recheck) => {
        recheck()
      })
  }, null)

  // A new key is a new part, and a new value the part selects on needs a new subscription.
  const selected = core.selectedKeys(part, props)
  useLayoutEffect(() => {
    const recheck = () => {
      check(true, true)
    }
    let all = rechecks.get(instance)
    if (!all) rechecks.set(instance, (all = new Set()))
    all.add(recheck)
    const unsubscribe = core.subscribe(
      part,
      () => {
        if (!handing?.pending.has(last)) check(false)
      },
      last.current.props
    )
    return () => {
      all.delete(recheck)
      unsubscribe()
    }
  }, [part, selected, check])

  return state
}

// A list's api, whose items' values key their parts.
type ListApi = { internal: { keyOf: (value: PropValue) => string } }
const isListApi = (api: unknown): api is ListApi =>
  isProps(api) && isProps(api.internal) && "keyOf" in api.internal

const kindOf = (spec: PropSpec) => (typeof spec === "object" ? spec.kind : spec)

// Where a prop comes from when it's left out: the slot, and that slot's prop,
// which `"group.id"` names and `"item"` leaves to the prop's own name.
function fromOf(spec: PropSpec, key: string) {
  if (typeof spec !== "object") return undefined
  const [slot = "", prop = key] = spec.from.split(".")
  return { slot, prop, required: !!spec.required }
}

// "tab-icon" is "TabIcon".
const pascal = (name: string) =>
  name.replace(/(^|-)(\w)/g, (_, _dash, char: string) => char.toUpperCase())

// Splits a component's props into those the schema names and the element's own.
function split(props: Props, schema: Record<string, PropSpec>) {
  const named: Props = {}
  const rest: Props = {}
  for (const key in props) (key in schema ? named : rest)[key] = props[key]
  return [named, rest] as const
}

// Each primitive's parts share one context: the instance, and the props of the
// parts around the one rendering, by slot, for props a nested part takes from
// its parent, like a handle's item `value`. `shown` has the same parts' props
// as they render, before they commit, which the api reads inside them, like a
// radio item its group's value. `provides` holds the slots whose props a
// nested part takes, which `createParts` fills in from the schema.
type Scope = {
  handle: Handle
  around: Record<string, Props>
  shown?: Record<string, Props>
}
type Scopes = {
  context: Context<Scope | null>
  provides: Set<string>
  keyed: Set<string>
}
const scopes = new WeakMap<Primitive, Scopes>()
function scopeOf(primitive: Primitive) {
  let scope = scopes.get(primitive)
  if (!scope) {
    scope = {
      context: createContext<Scope | null>(null),
      provides: new Set(),
      keyed: new Set(),
    }
    scopes.set(primitive, scope)
  }
  return scope
}

const isRenderProp = (value: unknown): value is RenderProp =>
  typeof value === "function" || isValidElement(value)

// An id on a `render` element wins its merge, so the part takes that one as
// it renders. A render function's can't be read until it runs.
function renderId(render: RenderProp | undefined) {
  if (!isValidElement(render)) return undefined
  const props: unknown = render.props
  return isProps(props) ? props.id : undefined
}

function usePartElement(
  target: Primitive | Handle,
  slot: string,
  slotProps: Props,
  props: Props,
  tag: string
): OctaneNode {
  const primitive = typeof target === "function" ? target : target.primitive
  const { context, provides, keyed } = scopeOf(primitive)
  const scope = useContext(context)
  const owner = typeof target === "function" ? scope?.handle : target
  if (!owner)
    throw new Error(
      `The ${primitive.name} ${slot} part must be used inside its root.`
    )
  const { render: given, ...rest } = props
  const render = isRenderProp(given) ? given : undefined
  // An instance a part renders with its handle, like a root's, reaches the parts inside it.
  const own = useMemo((): Scope => ({ handle: owner, around: {} }), [owner])
  const inside = scope?.handle === owner ? scope : own
  // The parts inside a keyed item take its key as its value, as every adapter's do.
  const around = keyed.has(slot)
    ? { ...slotProps, value: slotProps.id }
    : slotProps
  const provided: Scope = provides.has(slot)
    ? {
        handle: owner,
        around: { ...inside.around, [slot]: around },
        shown: { ...inside.shown, [slot]: slotProps },
      }
    : inside
  const state = usePartState(owner, slot, slotProps, provided.shown)
  // A part that shouldn't be in the page, like an unselected tab's panel, renders nothing.
  const part = owner.instance.part(slot, slotProps, true)
  // Removed with its component, a part lets go in this commit, not a microtask later.
  useLayoutEffect(
    () => () => {
      core.ref(part, host)(null)
    },
    [part]
  )
  const merged = readIn(
    owner,
    (showing) => {
      if (!core.present(part, slotProps, showing)) return undefined
      const id = renderId(render)
      const user = id === undefined ? rest : { ...rest, id }
      return elementProps(part, slotProps, user, showing)
    },
    provided.shown
  )
  const element = merged ? renderElement(tag, merged, render, state) : null
  if (provided === scope) return element
  return createElement(context, { value: provided }, element)
}

type Tag = keyof Octane.JSX.IntrinsicElements

// A slot's state, or none for a slot that hands render functions nothing.
type PartState<P extends Primitive, S extends SlotName<P>> =
  StateOf<P, S> extends object ? StateOf<P, S> : object

/**
 * Props every part takes: its element's props, `render`, and class names,
 * styles and children that may be functions of the part's state.
 */
type PartProps<T extends Tag, State extends object = object> = Omit<
  ComponentProps<T>,
  "class" | "className" | "style" | "children"
> & {
  /** Class names, or a function of the part's state that returns them. */
  className?: ClassValue | ((state: State) => ClassValue)
  /** Styles, or a function of the part's state that returns them. */
  style?: CSSProperties | string | ((state: State) => CSSProperties | undefined)
  /** Renders your own element: one that receives the part's props, or a function of the props and the state. */
  render?: RenderProp<State>
  /** Content, or a function of the part's state that returns it. */
  children?: OctaneNode | ((state: State) => OctaneNode)
}

/**
 * Renders one part of a primitive written by hand: its element, with the
 * slot's attributes and handlers merged into `props`, re-rendered when what
 * it shows changes, or nothing while the slot says it isn't present.
 * `handle` is `usePrimitive`'s, or the primitive, whose nearest instance it
 * uses. Given `usePrimitive`'s handle, the parts inside the element find that
 * instance.
 *
 * @example
 * function RatingStar({ value, ...props }: PartProps<"button"> & { value: string }) {
 *   return usePart(rating, "star", { value }, props, "button")
 * }
 */
function usePart<
  P extends Primitive,
  S extends SlotName<P>,
  T extends Tag = "div",
>(
  handle: P | PrimitiveHandle<P>,
  slot: S,
  slotProps: PropsOf<P, S> & object,
  props?: PartProps<T, PartState<P, S>>,
  tag?: T
) {
  return usePartElement(handle, slot, bag(slotProps), bag(props), tag ?? "div")
}

// "tab-icon" is `TabIcon`.
type Pascal<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Capitalize<Head>}${Pascal<Tail>}`
  : Capitalize<Name>

// A part's props: what its slot and, for a root, the options name, and its
// element's, without the ones those name.
type NamedProps<Named, State extends object, T extends Tag> = Named &
  Omit<PartProps<T, State>, keyof Named>

type RootSlot<P extends Primitive> = "root" & SlotName<P>

type RootProps<P extends Primitive, T extends Tag | undefined> = T extends Tag
  ? NamedProps<
      OptionsOf<P> & PropsOf<P, RootSlot<P>>,
      PartState<P, RootSlot<P>>,
      T
    >
  : OptionsOf<P> & { children?: OctaneNode }

/**
 * The components `createParts` makes: `Root`, and one per tagged slot, named
 * in Pascal case.
 */
type Parts<P extends Primitive, Tags extends { [S in SlotName<P>]?: Tag }> = {
  Root: (
    props: RootProps<P, Tags extends { root: Tag } ? Tags["root"] : undefined>
  ) => OctaneNode
} & {
  [
    S in SlotName<P> as S extends Exclude<keyof Tags, "root">
      ? Pascal<S>
      : never
  ]: (
    props: NamedProps<
      PropsOf<P, S>,
      PartState<P, S>,
      NonNullable<Tags[S & keyof Tags]> & Tag
    >
  ) => OctaneNode
}

// The tags `createParts` was given, by slot.
function tagsBySlot(tags: object) {
  const given = bag(tags)
  const result: Record<string, string> = {}
  for (const slot in given) {
    const tag = given[slot]
    if (typeof tag === "string") result[slot] = tag
  }
  return result
}

/**
 * Every part of a primitive as a component, typed from it. `Root` makes the
 * instance from the primitive's options and shares it with the parts inside
 * it. Each slot named in `tags` becomes a component that renders that tag,
 * named in Pascal case, like `TabIcon` for `tab-icon`. Without a `root` tag,
 * `Root` renders only its children. Every part takes `render`, and class
 * names, styles and children that may be functions of its state.
 *
 * @example
 * const { Root: Playlist, Track: PlaylistTrack } = createParts(playlist, { root: "ul", track: "li" })
 */
function createParts<
  P extends Primitive,
  Tags extends { [S in SlotName<P>]?: Tag },
>(primitive: P, tags: Tags): Parts<P, Tags>
function createParts(primitive: Primitive, tags: object) {
  const schema = core.schemaOf(primitive)
  const { context, provides, keyed } = scopeOf(primitive)
  for (const [slot, props] of Object.entries(schema.slots)) {
    for (const [key, spec] of Object.entries(props)) {
      const from = fromOf(spec, key)
      if (from) provides.add(from.slot)
      if (kindOf(spec) === "key") keyed.add(slot)
    }
  }
  const name = pascal(primitive.name)
  const { root: rootTag, ...partTags } = tagsBySlot(tags)
  const parts: Record<string, (props: Props) => OctaneNode> = {}

  parts.Root = (props: Props) => {
    const [options, rest] = split(props, schema.options)
    const handle = useHandle(primitive, options)
    if (rootTag) {
      const [slotProps, own] = split(rest, schema.slots.root ?? {})
      return usePartElement(handle, "root", slotProps, own, rootTag)
    }
    // A root that renders no element of its own, like a popover's, shares
    // its instance with the parts inside.
    const scope = useMemo((): Scope => ({ handle, around: {} }), [handle])
    return createElement(context, { value: scope, children: props.children })
  }

  for (const [slot, tag] of Object.entries(partTags)) {
    const own = schema.slots[slot] ?? {}
    const specs = Object.entries(own)
    const ids = specs.flatMap(([key, spec]) =>
      kindOf(spec) === "id" ? [key] : []
    )
    const keyProp = specs.find(([, spec]) => kindOf(spec) === "key")?.[0]
    const label = name + pascal(slot)
    parts[pascal(slot)] = (props: Props) => {
      const [slotProps, rest] = split(props, own)
      // An `id` the slot reads, like a trigger's key, is the element's own too.
      if (props.id !== undefined) rest.id = props.id
      // Unique ids for `id` props left out.
      const made = useId()
      for (const key of ids)
        slotProps[key] ??= ids.length > 1 ? `${made}-${key}` : made
      const scope = useContext(context)
      const api = scope?.handle.api
      if (keyProp && isListApi(api))
        slotProps.id ??= api.internal.keyOf(slotProps[keyProp])
      for (const [prop, spec] of specs) {
        const from = fromOf(spec, prop)
        if (!from || slotProps[prop] !== undefined) continue
        const around = scope?.around[from.slot]
        if (!around && from.required)
          throw new Error(
            `<${label}> must be used inside <${name}${pascal(from.slot)}>.`
          )
        slotProps[prop] = around?.[from.prop]
      }
      return usePartElement(primitive, slot, slotProps, rest, tag)
    }
  }
  return parts
}

export {
  createParts,
  mergeProps,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  type RenderProp,
}
