/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldDescription, FieldLabel } from "../../src/components/field"
import { Switch, SwitchThumb } from "../../src/components/switch"
import { SubmitForm } from "./form"

export function SwitchPage() {
  const [on, setOn] = useState(true)
  return (
    <main id="page-switch">
      <section id="uncontrolled">
        <SubmitForm id="sw-form">
          <Switch id="sw" name="wifi" aria-label="Wi-Fi">
            <SwitchThumb />
          </Switch>
        </SubmitForm>
      </section>
      <section id="controlled">
        <Switch id="csw" aria-label="Sound" checked={on} onCheckedChange={(next) => setOn(next)}>
          <SwitchThumb />
        </Switch>
        <output id="csw-value">{String(on)}</output>
        <button id="csw-outside" type="button" onClick={() => setOn(!on)}>
          Flip
        </button>
      </section>
      <section id="field">
        <Field name="alerts">
          <FieldLabel id="fsw-label">Alerts</FieldLabel>
          <Switch id="fsw">
            <SwitchThumb />
          </Switch>
          <FieldDescription id="fsw-description">Sent by email.</FieldDescription>
        </Field>
      </section>
      <section id="disabled">
        <Switch id="dsw" aria-label="Locked" disabled>
          <SwitchThumb />
        </Switch>
      </section>
    </main>
  )
}
