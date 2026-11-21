/** @jsxImportSource octane */
// The `render` prop, as an element and as a function, and class names,
// styles and children given as functions of the part's state.
import { useState } from "octane"
import { createParts, type RenderProp } from "../../src/primitive"
import { called } from "../app/harness"
import { disclosure, muteButton } from "./primitives"

const { Root: MuteButton } = createParts(muteButton, { root: "button" })
const Disclosure = createParts(disclosure, { trigger: "button", panel: "div" })

// An app's own component, which a render function may return.
function Fancy(props: Record<string, unknown>) {
  return (
    <span className="fancy-frame">
      <button {...props} data-fancy="yes" />
    </span>
  )
}

const modes = ["tag", "element", "function"] as const

export default function Fixture() {
  const [mode, setMode] = useState<(typeof modes)[number]>("tag")
  const renders: Record<(typeof modes)[number], { render?: RenderProp }> = {
    tag: {},
    element: { render: <a href="#switch" /> },
    function: { render: (props) => <em {...props} /> },
  }
  return (
    <main>
      <MuteButton
        id="as-element"
        className="from-app"
        style={{ color: "red", left: "1px" }}
        onClick={() => called("app's onClick")}
        render={
          <a
            href="#as-element"
            className="from-element"
            style={{ color: "blue", top: "2px" }}
            data-own="yes"
            onClick={() => called("element's onClick")}
          />
        }
      >
        As element
      </MuteButton>

      <MuteButton
        id="as-function"
        className="from-app"
        // Another tag takes the props by name: a button's handlers aren't a span's.
        render={(props: Record<string, unknown>, state) => (
          <span {...props} role="button" tabIndex={0} data-muted={String(state.muted)} />
        )}
      >
        As function
      </MuteButton>

      <MuteButton
        id="functions"
        className={(state) => (state.muted ? "is-muted" : "is-live")}
        style={(state) => ({ opacity: state.muted ? 0.5 : 1 })}
        render={(props, state) => <button {...props} data-state={state.muted ? "muted" : "live"} />}
      >
        {(state: { muted: boolean }) => (state.muted ? "Muted" : "Live")}
      </MuteButton>

      <MuteButton id="as-component" render={(props) => <Fancy {...props} />}>
        As component
      </MuteButton>

      <MuteButton
        id="element-prevents"
        onClick={() => called("app's onClick, skipped")}
        render={
          <button
            onClick={(event) => {
              called("element's onClick prevents")
              event.preventDefault()
            }}
          />
        }
      >
        Element prevents
      </MuteButton>

      <MuteButton id="element-children" render={<button>The element's own children</button>}>
        The part's children
      </MuteButton>

      <MuteButton id="replaced-by-element" render={<button id="element-id" />}>
        Id from the element
      </MuteButton>

      <section id="panel-id">
        <Disclosure.Root defaultOpen>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Panel render={<section id="rendered-panel" />}>Panel</Disclosure.Panel>
        </Disclosure.Root>
      </section>

      <section id="switching">
        <MuteButton id="switch-target" {...renders[mode]}>
          Rendered as {mode}
        </MuteButton>
        <button
          id="switch"
          type="button"
          onClick={() => setMode(modes[(modes.indexOf(mode) + 1) % modes.length] ?? "tag")}
        >
          Switch
        </button>
      </section>
    </main>
  )
}
