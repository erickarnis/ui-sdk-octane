/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createTokenInputController,
  fromText,
  toText,
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
  type Token,
  type TokenInputValue,
} from "../../src/components/token-input"
import { SubmitForm } from "./form"

const controller = createTokenInputController()
const start = fromText("Open [@routes.ts](file:routes.ts) and [@app.ts](file:app.ts)")

const renderToken = (token: Token) => (
  <TokenInputToken className="chip">
    {token.label}
    <TokenInputTokenRemove className="remove">x</TokenInputTokenRemove>
  </TokenInputToken>
)

export function TokenInputPage() {
  const [value, setValue] = useState<TokenInputValue>(fromText("Hi [@ada](user:ada)"))
  const [sent, setSent] = useState("")
  return (
    <main id="page-token-input">
      <section id="tokens">
        <SubmitForm id="t-form">
          <TokenInput name="prompt" defaultValue={start} controller={controller} renderToken={renderToken}>
            <TokenInputEditor id="t-editor" aria-label="Prompt" placeholder="Ask" />
          </TokenInput>
        </SubmitForm>
        <button id="t-text" type="button" onClick={(event: Event) => {
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.textContent = controller.getText()
          }}>
          Read
        </button>
      </section>
      <section id="controlled">
        <TokenInput value={value} onValueChange={(next) => setValue(next)} onSubmit={(next) => setSent(toText(next))}>
          <TokenInputEditor id="c-editor" aria-label="Message" placeholder="Message" />
        </TokenInput>
        <output id="c-value">{toText(value)}</output>
        <output id="c-sent">{sent}</output>
        <button id="c-clear" type="button" onClick={() => setValue([])}>
          Clear from outside
        </button>
      </section>
    </main>
  )
}
