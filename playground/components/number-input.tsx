/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldDescription, FieldLabel } from "../../src/components/field"
import {
  createNumberInputController,
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  NumberInputScrubArea,
  NumberInputScrubAreaCursor,
} from "../../src/components/number-input"
import { SubmitForm } from "./form"

const controller = createNumberInputController()

export function NumberInputPage() {
  const [value, setValue] = useState<number | null>(5)
  const [committed, setCommitted] = useState("")
  return (
    <main id="page-number-input">
      <SubmitForm id="ni-form">
        <NumberInput id="ni" name="qty" defaultValue={3} min={0} max={10}>
          <NumberInputScrubArea id="ni-scrub">
            <span>Qty</span>
            <NumberInputScrubAreaCursor />
          </NumberInputScrubArea>
          <NumberInputGroup id="ni-group">
            <NumberInputDecrement id="ni-dec">-</NumberInputDecrement>
            <NumberInputControl id="ni-in" aria-label="Quantity" />
            <NumberInputIncrement id="ni-inc">+</NumberInputIncrement>
          </NumberInputGroup>
        </NumberInput>
      </SubmitForm>
      <NumberInput
        id="cni"
        value={value}
        onValueChange={(next) => setValue(next)}
        onValueCommit={(next) => setCommitted(String(next))}
        step={0.5}
        format={{ style: "currency", currency: "USD" }}
        locale="en-US"
        controller={controller}
      >
        <NumberInputControl id="cni-in" aria-label="Price" />
      </NumberInput>
      <output id="cni-value">{String(value) + "|" + committed}</output>
      <button id="cni-outside" type="button" onClick={() => setValue(12)}>
        Set
      </button>
      <NumberInputScrubArea id="outside-scrub" controller={controller}>
        Drag
      </NumberInputScrubArea>
      <Field name="age">
        <FieldLabel id="fni-label">Age</FieldLabel>
        <NumberInput>
          <NumberInputControl id="fni-in" />
        </NumberInput>
        <FieldDescription id="fni-description">In years.</FieldDescription>
      </Field>
    </main>
  )
}
