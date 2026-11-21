/** @jsxImportSource octane */
// Core's form controls: checkbox, switch and toggle through `createParts`,
// and a radio group written with `usePrimitive` and `usePart`, since its
// instance's element is the `group` slot and each radio is a `root`.
import { useState } from "octane"
import { checkbox } from "@ui-sdk/core/checkbox"
import { radioGroup } from "@ui-sdk/core/radio"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { toggle } from "@ui-sdk/core/toggle"
import { createParts, usePart, usePrimitive, type PartProps } from "../../src/primitive"
import { called } from "../app/harness"

const Checkbox = createParts(checkbox, { root: "button", indicator: "span", input: "input" })
const Switch = createParts(switchPrimitive, { root: "button", thumb: "span", input: "input" })
const Toggle = createParts(toggle, { root: "button" })
const { Indicator: RadioIndicator } = createParts(radioGroup, { indicator: "span" })

type RadioGroupProps = Omit<PartProps<"div">, "value" | "defaultValue"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | null) => void
}

function RadioGroup({ value, defaultValue, onValueChange, ...props }: RadioGroupProps) {
  const options = {
    ...(value === undefined ? {} : { value }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(onValueChange ? { onValueChange } : {}),
  }
  const group = usePrimitive(radioGroup, options)
  return usePart(group, "group", {}, props, "div")
}

function Radio({ value, disabled = false, ...props }: PartProps<"button"> & { value: string; disabled?: boolean }) {
  return usePart(radioGroup, "root", { value, disabled }, props, "button")
}

export default function Fixture() {
  const [checked, setChecked] = useState(false)
  const [plan, setPlan] = useState("free")
  const [paid, setPaid] = useState("monthly")
  return (
    <main>
      <section id="checkbox">
        <Checkbox.Root aria-label="Terms" name="terms" value="accepted" onCheckedChange={(next) => called("terms onCheckedChange", next)}>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
          <Checkbox.Input />
        </Checkbox.Root>
        <Checkbox.Root aria-label="Disabled" disabled>
          <Checkbox.Indicator keepMounted>✓</Checkbox.Indicator>
        </Checkbox.Root>
      </section>

      <section id="switch">
        <Switch.Root aria-label="Uncontrolled" defaultChecked name="notify">
          <Switch.Thumb />
          <Switch.Input />
        </Switch.Root>
        <Switch.Root
          aria-label="Controlled"
          checked={checked}
          onCheckedChange={(next) => {
            called("switch onCheckedChange", next)
            setChecked(next)
          }}
        >
          <Switch.Thumb />
        </Switch.Root>
        <Switch.Root aria-label="Stuck" checked={false} onCheckedChange={(next) => called("stuck onCheckedChange", next)}>
          <Switch.Thumb />
        </Switch.Root>
      </section>

      <section id="toggle">
        <Toggle.Root aria-label="Bold" onPressedChange={(next) => called("bold onPressedChange", next)}>
          B
        </Toggle.Root>
        <Toggle.Root aria-label="Italic" defaultPressed>
          I
        </Toggle.Root>
      </section>

      <section id="radio">
        <RadioGroup
          aria-label="Plan"
          value={plan}
          onValueChange={(next) => {
            called("plan onValueChange", next)
            if (next !== null) setPlan(next)
          }}
        >
          <Radio value="free" aria-label="Free">
            <RadioIndicator>●</RadioIndicator>
          </Radio>
          <Radio value={paid} aria-label="Paid">
            <RadioIndicator>●</RadioIndicator>
          </Radio>
          <Radio value="team" aria-label="Team" disabled>
            <RadioIndicator keepMounted>●</RadioIndicator>
          </Radio>
        </RadioGroup>
        <output id="plan">{plan}</output>
        <button id="yearly" type="button" onClick={() => setPaid("yearly")}>
          Make the paid plan yearly
        </button>
        <button id="choose-yearly" type="button" onClick={() => setPlan("yearly")}>
          Choose yearly from outside
        </button>
      </section>
    </main>
  )
}
