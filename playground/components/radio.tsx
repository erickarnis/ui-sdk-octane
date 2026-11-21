/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { Radio, RadioGroup, RadioIndicator } from "../../src/components/radio"
import { SubmitForm } from "./form"

const sizes = ["small", "medium", "large", "huge"]

export function RadioPage() {
  const [size, setSize] = useState<string | null>("medium")
  return (
    <main id="page-radio">
      <section id="uncontrolled">
        <SubmitForm id="rg-form">
          <RadioGroup id="rg" name="size" aria-label="Size">
            {sizes.map((value) => (
              <Radio key={value} id={"rg-" + value} value={value} disabled={value === "large"} aria-label={value}>
                <RadioIndicator>o</RadioIndicator>
              </Radio>
            ))}
          </RadioGroup>
        </SubmitForm>
      </section>
      <section id="controlled">
        <RadioGroup id="crg" aria-label="Controlled size" value={size} onValueChange={(next) => setSize(next)}>
          {sizes.map((value) => (
            <Radio key={value} id={"crg-" + value} value={value} aria-label={value}>
              <RadioIndicator keepMounted>o</RadioIndicator>
            </Radio>
          ))}
        </RadioGroup>
        <output id="crg-value">{String(size)}</output>
        <button id="crg-set" type="button" onClick={() => setSize("huge")}>
          Set huge
        </button>
      </section>
      <section id="field">
        <Field name="plan">
          <FieldLabel id="frg-label">Plan</FieldLabel>
          <RadioGroup id="frg" defaultValue="free">
            <Radio id="frg-free" value="free" aria-label="Free" />
            <Radio id="frg-pro" value="pro" aria-label="Pro" />
          </RadioGroup>
        </Field>
      </section>
    </main>
  )
}
