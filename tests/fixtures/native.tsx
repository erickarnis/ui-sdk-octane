/** @jsxImportSource octane */
// What Octane has and React doesn't: attributes in the DOM's own spelling and
// a style written as text. And an instance that starts asleep, which a part
// must not wake by rendering.
import { definePrimitive } from "@ui-sdk/core"
import { useState } from "octane"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"
import { muteButton } from "./primitives"

const field = definePrimitive({
  name: "native-field",
  state: () => ({}),
  api: () => ({}),
  slots: (slot) => ({
    root: slot({
      attrs: () => ({
        autocomplete: "off",
        spellcheck: "false",
        inputmode: "numeric",
        tabindex: "-1",
      }),
    }),
  }),
})

const sleeper = definePrimitive({
  name: "sleeper",
  asleep: () => true,
  state: () => ({ presses: 0 }),
  api: (context) => {
    called("api built")
    return {
      press: () =>
        context.store.set({ presses: context.store.get().presses + 1 }),
    }
  },
  slots: (slot) => ({
    root: slot({}),
    item: slot({
      attrs: (state) => ({
        type: "button",
        "data-presses": String(state.presses),
      }),
      press: ({ api }) => api.press(),
    }),
  }),
})

const { Root: Field } = createParts(field, { root: "input" })
const { Root: MuteButton } = createParts(muteButton, { root: "button" })
const Sleeper = createParts(sleeper, { root: "div", item: "button" })

export default function Fixture() {
  const [renders, setRenders] = useState(0)
  return (
    <main>
      <button id="again" type="button" onClick={() => setRenders(renders + 1)}>
        Render again ({renders})
      </button>
      <Field
        id="lowercase"
        aria-label="Lowercase"
        autocomplete="email"
        spellcheck="true"
        inputmode="text"
        tabindex={renders + 1}
      />
      <Field
        id="camel"
        aria-label="Camel case"
        autoComplete="email"
        spellCheck="true"
        inputMode="text"
        tabIndex={renders + 1}
      />
      <MuteButton
        id="styled"
        style="background-image: url(data:image/gif;base64,R0lGODlhAQABAAAAACw=); color: rgb(1, 2, 3)"
      >
        Styled
      </MuteButton>
      <Sleeper.Root id="sleeper">
        <Sleeper.Item id="first">One</Sleeper.Item>
        <Sleeper.Item id="second">Two</Sleeper.Item>
      </Sleeper.Root>
    </main>
  )
}
