/** @jsxImportSource octane */
// Core's accordion: parts nested in an item take the item's `value` when
// theirs is left out, and each item's panel comes and goes.
import { useState } from "octane"
import { accordion } from "@ui-sdk/core/accordion"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"

const Accordion = createParts(accordion, {
  root: "div",
  item: "div",
  header: "h3",
  trigger: "button",
  panel: "div",
})

const questions = ["shipping", "returns", "warranty"]

export default function Fixture() {
  const [value, setValue] = useState<string[]>(["returns"])
  return (
    <main>
      <Accordion.Root
        id="single"
        defaultValue={["shipping"]}
        onValueChange={(next, details) => called("single onValueChange", next, details.reason)}
      >
        {questions.map((question) => (
          <Accordion.Item
            key={question}
            value={question}
            disabled={question === "warranty"}
            onOpenChange={(open) => called(`${question} onOpenChange`, open)}
          >
            <Accordion.Header>
              <Accordion.Trigger>About {question}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>All about {question}.</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <Accordion.Root id="multiple" multiple value={value} onValueChange={(next) => setValue(next)}>
        {questions.map((question) => (
          <Accordion.Item key={question} value={question}>
            <Accordion.Header>
              <Accordion.Trigger>{question}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel keepMounted>
              {(state: { open: boolean }) => `${question} is ${state.open ? "open" : "closed"}`}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
      <output id="value">{value.join(",")}</output>
      <button id="open-all" type="button" onClick={() => setValue(questions)}>
        Open all from outside
      </button>
    </main>
  )
}
