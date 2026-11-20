/** @jsxImportSource octane */
import { useState } from "octane"
import { Checkbox, CheckboxGroup, CheckboxIndicator } from "../../src/components/checkbox"
import type { CheckedState } from "../../src/components/checkbox"
import { Field, FieldLabel } from "../../src/components/field"
import { SubmitForm } from "./form"

const toppings = ["cheese", "olives", "basil"]

export function CheckboxPage() {
  const [checked, setChecked] = useState<CheckedState>("indeterminate")
  const [picked, setPicked] = useState<string[]>(["olives"])
  return (
    <main id="page-checkbox">
      <section id="uncontrolled">
        <SubmitForm id="cb-form">
          <Checkbox id="cb" name="terms" value="yes" aria-label="Accept terms">
            <CheckboxIndicator id="cb-indicator">x</CheckboxIndicator>
          </Checkbox>
        </SubmitForm>
      </section>
      <section id="controlled">
        <Checkbox id="ccb" aria-label="Mixed" checked={checked} onCheckedChange={(next) => setChecked(next)}>
          <CheckboxIndicator>{(state: { indeterminate: boolean }) => (state.indeterminate ? "-" : "x")}</CheckboxIndicator>
        </Checkbox>
        <output id="ccb-value">{String(checked)}</output>
      </section>
      <section id="group">
        <SubmitForm id="group-form">
          <h3 id="toppings-label">Toppings</h3>
          <CheckboxGroup
            id="cbg"
            aria-labelledby="toppings-label"
            name="topping"
            value={picked}
            onValueChange={(next) => setPicked(next)}
            allValues={toppings}
          >
            <Checkbox id="cbg-all" parent aria-label="All toppings">
              <CheckboxIndicator>{(state: { indeterminate: boolean }) => (state.indeterminate ? "-" : "x")}</CheckboxIndicator>
            </Checkbox>
            {toppings.map((topping) => (
              <Checkbox key={topping} id={"cbg-" + topping} value={topping} aria-label={topping} disabled={topping === "basil"}>
                <CheckboxIndicator>x</CheckboxIndicator>
              </Checkbox>
            ))}
          </CheckboxGroup>
          <output id="cbg-value">{picked.join(",")}</output>
          <button id="cbg-set" type="button" onClick={() => setPicked(["cheese", "basil"])}>
            Set from outside
          </button>
        </SubmitForm>
      </section>
      <section id="field">
        <Field name="news">
          <FieldLabel id="fcb-label">Newsletter</FieldLabel>
          <Checkbox id="fcb">
            <CheckboxIndicator>x</CheckboxIndicator>
          </Checkbox>
        </Field>
      </section>
    </main>
  )
}
