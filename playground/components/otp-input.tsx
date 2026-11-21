/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { OTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot } from "../../src/components/otp-input"
import { SubmitForm } from "./form"

export function OtpInputPage() {
  const [code, setCode] = useState("12")
  const [committed, setCommitted] = useState("")
  return (
    <main id="page-otp-input">
      <SubmitForm id="otp-form">
        <OTPInput id="otp" name="code" maxLength={6} aria-label="Code">
          <OTPInputGroup>
            <OTPInputSlot index={0} />
            <OTPInputSlot index={1} />
            <OTPInputSlot index={2} />
          </OTPInputGroup>
          <OTPInputSeparator id="otp-sep">-</OTPInputSeparator>
          <OTPInputGroup>
            <OTPInputSlot index={3} />
            <OTPInputSlot index={4} />
            <OTPInputSlot index={5} />
          </OTPInputGroup>
        </OTPInput>
      </SubmitForm>
      <OTPInput id="cotp" maxLength={4} aria-label="PIN" value={code} onValueChange={(next) => setCode(next)} onValueCommit={(value) => setCommitted(value)}>
        {[0, 1, 2, 3].map((index) => (
          <OTPInputSlot key={index} index={index}>
            {(state) => (state.char ? "*" : "_")}
          </OTPInputSlot>
        ))}
      </OTPInput>
      <output id="cotp-value">{code + "|" + committed}</output>
      <button id="cotp-outside" type="button" onClick={() => setCode("9")}>
        Set
      </button>
      <Field name="verify">
        <FieldLabel id="fotp-label">Verification</FieldLabel>
        <OTPInput maxLength={2} id="fotp">
          <OTPInputSlot index={0} />
          <OTPInputSlot index={1} />
        </OTPInput>
      </Field>
    </main>
  )
}
