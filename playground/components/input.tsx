/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldDescription, FieldLabel } from "../../src/components/field"
import { Input, InputClear, InputGroup } from "../../src/components/input"
import { SubmitForm } from "./form"

export function InputPage() {
  const [text, setText] = useState("ab")
  const [reasons, setReasons] = useState<string[]>([])
  return (
    <main id="page-input">
      <section id="uncontrolled">
        <SubmitForm id="in-form">
          <Input id="in" name="q" defaultValue="hello" aria-label="Query" />
        </SubmitForm>
      </section>
      <section id="controlled">
        <Input
          id="cin"
          aria-label="Code"
          value={text}
          onValueChange={(next, details) => {
            setText(next.toUpperCase())
            setReasons((list) => [...list, details.reason])
          }}
        />
        <output id="cin-value">{text}</output>
        <output id="cin-reasons">{reasons.join(",")}</output>
        <button id="cin-outside" type="button" onClick={() => setText("SET")}>
          Set
        </button>
      </section>
      <section id="fixed">
        <Input id="fin" aria-label="Fixed" value="fixed" />
      </section>
      <section id="field">
        <Field name="email">
          <FieldLabel id="fin-label">Email</FieldLabel>
          <Input id="field-in" type="email" required />
          <FieldDescription id="fin-description">We never share it.</FieldDescription>
        </Field>
        <Field name="locked" disabled>
          <FieldLabel>Locked</FieldLabel>
          <Input id="field-off" />
        </Field>
      </section>
      <section id="group">
        <InputGroup id="grp">
          <span id="grp-icon">@</span>
          <Input id="grp-in" aria-label="Search" defaultValue="term" />
          <InputClear id="grp-clear" aria-label="Clear" />
        </InputGroup>
      </section>
    </main>
  )
}
