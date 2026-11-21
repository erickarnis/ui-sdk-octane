/** @jsxImportSource octane */
import { useState } from "octane"
import { TokenInput, TokenInputEditor, toText, type TokenInputValue } from "../../src/components/token-input"
import {
  TriggerMenu,
  TriggerMenuContent,
  TriggerMenuEmpty,
  TriggerMenuInput,
  TriggerMenuList,
} from "../../src/components/trigger-menu"

const people = [
  { value: "ada", label: "Ada" },
  { value: "alan", label: "Alan" },
  { value: "grace", label: "Grace" },
]
const commands = ["help", "clear", "share"]

export function TriggerMenuPage() {
  const [value, setValue] = useState<TokenInputValue>([])
  const [picked, setPicked] = useState("")
  return (
    <main id="page-trigger-menu">
      <section id="textarea">
        <TriggerMenu
          triggers={[
            { char: "@", items: people },
            { char: "/", items: commands, boundary: "line" },
          ]}
          onSelect={(next) => setPicked(String(next))}
        >
          <TriggerMenuInput id="tm-input" aria-label="Message" />
          <TriggerMenuContent id="tm-content">
            <TriggerMenuList id="tm-list" />
            <TriggerMenuEmpty id="tm-empty">Nobody</TriggerMenuEmpty>
          </TriggerMenuContent>
        </TriggerMenu>
        <output id="tm-picked">{picked}</output>
      </section>
      <section id="tokens">
        <TokenInput value={value} onValueChange={(next) => setValue(next)}>
          <TokenInputEditor id="tk-editor" aria-label="Prompt" />
          <TriggerMenu triggers={[{ char: "@", type: "user", items: people }]} />
        </TokenInput>
        <output id="tk-value">{toText(value)}</output>
      </section>
    </main>
  )
}
