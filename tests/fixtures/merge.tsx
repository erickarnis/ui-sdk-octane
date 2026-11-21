/** @jsxImportSource octane */
// `mergeProps` and `renderElement` on their own, with no primitive behind
// them: each element below is rendered from merged props, so the page shows
// what the merge made.
import { useRef, useState } from "octane"
import { mergeProps, renderElement } from "../../src/primitive"
import { called } from "../app/harness"

type Pressed = { pressed: boolean }

export default function Fixture() {
  const [pressed, setPressed] = useState(false)
  const [shown, setShown] = useState(true)
  const object = useRef<HTMLElement | null>(null)
  const state: Pressed = { pressed }
  return (
    <main>
      {renderElement(
        "p",
        mergeProps(
          { id: "earlier-id", title: "kept", "data-earlier": "yes", children: "Later props win" },
          { id: "later-wins", title: undefined, "data-later": "yes" }
        )
      )}

      {renderElement(
        "p",
        mergeProps(
          { id: "classes", className: "one", children: "Class names combine" },
          { className: "two" },
          { className: undefined },
          { className: "three" }
        )
      )}

      {renderElement(
        "p",
        mergeProps(
          { id: "styles", style: { color: "red", left: "1px" }, children: "Styles merge" },
          { style: { color: "blue", top: "2px" } }
        )
      )}

      {renderElement(
        "p",
        mergeProps(
          {
            id: "functions",
            className: (now: Pressed) => (now.pressed ? "is-pressed" : "is-idle"),
            style: (now: Pressed) => ({ opacity: now.pressed ? 0.5 : 1 }),
            children: (now: Pressed) => (now.pressed ? "Pressed" : "Idle"),
          },
          { style: { color: "green" } }
        ),
        undefined,
        state
      )}

      {renderElement(
        "p",
        mergeProps(
          {
            id: "class-function",
            className: (now: Pressed) => (now.pressed ? "is-pressed" : "is-idle"),
            children: "A class function and a class name",
          },
          { className: "always" }
        ),
        undefined,
        state
      )}

      {renderElement(
        "button",
        mergeProps(
          { id: "handlers", type: "button", children: "Handlers", onClick: () => called("first source") },
          { onClick: () => called("second source") },
          { onClick: () => called("third source") }
        )
      )}

      {renderElement(
        "button",
        mergeProps(
          { id: "prevented", type: "button", children: "Prevented", onClick: () => called("first source, skipped") },
          {
            onClick: (event: Event) => {
              called("second source prevents")
              event.preventDefault()
            },
          },
          { onClick: () => called("third source") }
        )
      )}

      {shown &&
        renderElement(
          "span",
          mergeProps(
            {
              id: "refs",
              children: "Refs",
              ref: (el: HTMLElement | null) => {
                called("callback ref", el)
              },
            },
            { ref: object }
          )
        )}

      {renderElement(
        "div",
        { id: "as-element", className: "from-props", onClick: () => called("props' onClick"), children: "As element" },
        <a href="#as-element" className="from-element" onClick={() => called("element's onClick")} />,
        state
      )}

      {renderElement(
        "div",
        { id: "as-function", className: (now: Pressed) => (now.pressed ? "on" : "off"), children: "As function" },
        (props: Record<string, unknown>, now: Pressed) => <em {...props} data-pressed={String(now.pressed)} />,
        state
      )}

      <section aria-label="the app">
        <button id="press" type="button" onClick={() => setPressed(!pressed)}>
          Press
        </button>
        <button id="toggle" type="button" onClick={() => setShown(!shown)}>
          Toggle the element with refs
        </button>
        <button id="read" type="button" onClick={() => called("object ref holds", object.current)}>
          Read the object ref
        </button>
      </section>

      <pre id="raw">
        {JSON.stringify(
          mergeProps({ className: "a", style: { color: "red" }, id: "x" }, { className: "b", style: { top: 0 }, id: "y" })
        )}
      </pre>
      <pre id="proto">
        {JSON.stringify([
          mergeProps({ className: "a" }, JSON.parse('{"__proto__":{"polluted":true},"id":"a"}')).id,
          "polluted" in {},
        ])}
      </pre>
    </main>
  )
}
