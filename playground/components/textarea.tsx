/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { Textarea } from "../../src/components/textarea"
import { SubmitForm } from "./form"

export function TextareaPage() {
  const [sent, setSent] = useState("")
  const [text, setText] = useState("")
  return (
    <main id="page-textarea">
      <SubmitForm id="ta-form">
        <Textarea id="ta" name="note" defaultValue="first" aria-label="Note" />
        <Textarea id="ta-enter" name="chat" aria-label="Chat" submitShortcut="enter" />
      </SubmitForm>
      <Textarea
        id="cta"
        aria-label="Message"
        value={text}
        onValueChange={(next) => setText(next)}
        submitShortcut="enter"
        onSubmit={(value) => {
          setSent(value)
          setText("")
        }}
      />
      <output id="cta-sent">{sent}</output>
      <Textarea id="grow" aria-label="Grows" autoResize rows={1} style={{ width: "200px" }} />
      <Field name="bio">
        <FieldLabel id="bio-label">Bio</FieldLabel>
        <Textarea id="bio" />
      </Field>
    </main>
  )
}
