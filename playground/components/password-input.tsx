/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { PasswordInput, PasswordInputControl, PasswordInputToggle } from "../../src/components/password-input"
import { SubmitForm } from "./form"

export function PasswordInputPage() {
  const [shown, setShown] = useState(false)
  const [secret, setSecret] = useState("")
  return (
    <main id="page-password-input">
      <SubmitForm id="pw-form">
        <PasswordInput id="pw" name="password" defaultValue="hunter2">
          <span id="pw-icon">*</span>
          <PasswordInputControl id="pw-in" aria-label="Password" />
          <PasswordInputToggle id="pw-toggle" aria-label="Show password" />
        </PasswordInput>
      </SubmitForm>
      <PasswordInput id="cpw" value={secret} onValueChange={(next) => setSecret(next)} visible={shown} onVisibleChange={(next) => setShown(next)}>
        <PasswordInputControl id="cpw-in" aria-label="Secret" />
        <PasswordInputToggle id="cpw-toggle" aria-label="Show secret" />
      </PasswordInput>
      <output id="cpw-value">{secret + "|" + String(shown)}</output>
      <Field name="pin">
        <FieldLabel id="fpw-label">PIN</FieldLabel>
        <PasswordInput>
          <PasswordInputControl id="fpw-in" />
        </PasswordInput>
      </Field>
    </main>
  )
}
