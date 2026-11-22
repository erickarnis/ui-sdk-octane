/** @jsxImportSource octane */
// Ported from @ui-sdk/react's preferences (Apache-2.0, 0.1.0-beta.13).
import { preferencesScript, type PreferenceLike } from "@ui-sdk/core"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type OctaneNode,
} from "octane"
import { mergeRefs } from "../render-element.js"

/**
 * Props of `Preferences`.
 */
type PreferencesProps = Omit<ComponentProps<"div">, "children"> & {
  /** The preferences to show, from `createPreference` or `createColorScheme`. */
  preferences: readonly PreferenceLike[]
  /** The nonce your Content Security Policy gives inline scripts. */
  nonce?: string
  children?: OctaneNode
}

const noSubscribe = () => () => {}

// The same array while every preference in it is, so an inline list doesn't resubscribe each render.
function useStable(preferences: readonly PreferenceLike[]) {
  const ref = useRef(preferences)
  const same =
    ref.current.length === preferences.length &&
    ref.current.every((preference, index) => preference === preferences[index])
  if (!same) {
    ref.current = preferences
  }
  return ref.current
}

// The current values, not the render's, which right after hydration are the
// server's. Its own element too: a restore that `onValueChange` cancels leaves
// the render's value, and Octane won't touch the attribute the script set.
function show(list: readonly PreferenceLike[], element: HTMLElement | null) {
  for (const preference of list) {
    ;(preference.global ? document.documentElement : element)?.setAttribute(
      preference.attribute,
      preference.get().value
    )
  }
}

// `display: contents` ahead of the app's styles, which may be an object or text in Octane.
function contents(style: PreferencesProps["style"]) {
  if (typeof style === "string") return `display:contents;${style}`
  return { display: "contents", ...style }
}

/**
 * Shows preferences on `data-*` attributes, so CSS styles by them from the
 * first paint: global ones on `<html>`, the rest on its own element, which
 * has `display: contents`. On the server it renders one inline script as its
 * first child, which puts every saved value on its attribute as the page
 * loads, before hydration. Content that reads a preference, through
 * `usePreference`, catches up after hydration.
 */
function Preferences({
  preferences,
  nonce,
  children,
  style,
  ref,
  ...props
}: PreferencesProps): OctaneNode {
  const list = useStable(preferences)
  const element = useRef<HTMLDivElement | null>(null)
  // True on the server and while hydrating, when the script is in the HTML. A
  // client-only render leaves it out, since the browser never runs a script Octane inserts.
  const fromServer = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true
  )
  const subscribe = useCallback(
    (listener: () => void) => {
      const stops = list.map((preference) => preference.subscribe(listener))
      return () => stops.forEach((stop) => stop())
    }
  )
  // One string, so the snapshot compares equal until a value changes.
  const values = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(list.map((preference) => preference.get().value)),
    () =>
      JSON.stringify(list.map((preference) => preference.initialState.value))
  )
  // Before paint, where no script ran, like a root layout that mounts `<html>`
  // again on a client navigation, and again once subscribing reads saved values.
  // The arrays stay: the effects read the values through `list`, not `values`.
  useLayoutEffect(() => show(list, element.current), [list, values])
  useEffect(() => show(list, element.current), [list, values])
  const shown: unknown = JSON.parse(values)
  const attributes: Record<string, string> = {}
  list.forEach((preference, index) => {
    if (!preference.global && Array.isArray(shown)) {
      attributes[preference.attribute] = String(shown[index])
    }
  })
  // The script changes these attributes before hydration, so they may differ from the server's HTML.
  return (
    <div
      data-slot="preferences"
      {...attributes}
      {...props}
      // A ref may be a list of refs in Octane; `mergeRefs` makes one stable list.
      // SAFETY: `mergeRefs` returns one of the two refs or a list of both, and
      // both are refs to this div.
      ref={mergeRefs(element, ref ?? null) as ComponentProps<"div">["ref"]}
      style={contents(style)}
      suppressHydrationWarning
    >
      {fromServer ? (
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: preferencesScript(list) }}
        />
      ) : null}
      {children}
    </div>
  )
}

/**
 * A preference's state, like `{ value: "dark" }`, or a color scheme's. It's
 * the server's while hydrating, so the page hydrates without a mismatch, and
 * the saved value right after.
 */
function usePreference<State>(preference: {
  get: () => State
  initialState: State
  subscribe: (listener: () => void) => () => void
}): State {
  return useSyncExternalStore(
    preference.subscribe,
    preference.get,
    () => preference.initialState
  )
}

export { Preferences, type PreferencesProps, usePreference }
