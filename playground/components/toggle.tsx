/** @jsxImportSource octane */
import { useState } from "octane"
import { Toggle, ToggleGroup, ToggleIcon } from "../../src/components/toggle"

export function TogglePage() {
  const [pressed, setPressed] = useState(false)
  const [align, setAlign] = useState<string[]>(["left"])
  return (
    <main id="page-toggle">
      <section id="single">
        <Toggle id="tg" aria-label="Bold">
          <ToggleIcon>B</ToggleIcon>
        </Toggle>
        <Toggle id="ctg" pressed={pressed} onPressedChange={(next) => setPressed(next)}>
          {(state: { pressed: boolean }) => (state.pressed ? "On" : "Off")}
        </Toggle>
        <output id="ctg-value">{String(pressed)}</output>
        <button id="ctg-outside" type="button" onClick={() => setPressed(!pressed)}>
          Flip
        </button>
        <Toggle id="dtg" disabled>
          Disabled
        </Toggle>
      </section>
      <section id="group">
        <ToggleGroup id="tgg" aria-label="Alignment" value={align} onValueChange={(next) => setAlign(next)}>
          <Toggle id="tgg-left" value="left">
            Left
          </Toggle>
          <Toggle id="tgg-center" value="center">
            Center
          </Toggle>
          <Toggle id="tgg-right" value="right">
            Right
          </Toggle>
        </ToggleGroup>
        <output id="tgg-value">{align.join(",")}</output>
        <button id="tgg-set" type="button" onClick={() => setAlign(["right"])}>
          Set right
        </button>
      </section>
      <section id="multiple">
        <ToggleGroup id="mtgg" aria-label="Style" multiple defaultValue={["bold"]} orientation="vertical">
          <Toggle id="mtgg-bold" value="bold">
            Bold
          </Toggle>
          <Toggle id="mtgg-italic" value="italic">
            Italic
          </Toggle>
        </ToggleGroup>
      </section>
    </main>
  )
}
