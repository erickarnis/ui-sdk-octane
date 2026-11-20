// What the component files need that @ui-sdk/react's get from React or from
// looser types: nothing here has a counterpart upstream.
import { isChildrenBlock, type OctaneNode } from "octane"
import type { Props } from "../render-element"

/**
 * `T` with each key that may be undefined left out instead, which is how
 * `exactOptionalPropertyTypes` reads an option the app didn't pass.
 */
type Defined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<
    T[K],
    undefined
  >
}

/**
 * The same options or props without the keys that hold undefined. Upstream
 * passes those through; core reads a missing option and an undefined one
 * alike.
 */
function defined<T extends object>(value: T): Defined<T>
function defined(value: object) {
  const result: Props = {}
  for (const [key, entry] of Object.entries(value))
    if (entry !== undefined) result[key] = entry
  return result
}

/** Content that may be a function of a part's state. */
type Content<State> = OctaneNode | ((state: State) => OctaneNode)

// Children written in a template arrive as a compiled block, which is a
// function too, and only Octane may call it.
const isContentFunction = <State>(
  children: Content<State>
): children is (state: State) => OctaneNode =>
  typeof children === "function" && !isChildrenBlock(children)

/** A part's content for `state`: upstream's `typeof children === "function" ? children(state) : children`. */
function contentOf<State>(children: Content<State>, state: State): OctaneNode {
  return isContentFunction(children) ? children(state) : children
}

export { contentOf, defined, isContentFunction, type Content, type Defined }
