/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import {
  Select,
  SelectClear,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectList,
  SelectSelectAll,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectValueIcon,
} from "../../src/components/select"
import { SubmitForm } from "./form"

const planets = [
  { type: "group" as const, label: "Inner", items: [{ value: "mercury", label: "Mercury" }, { value: "venus", label: "Venus" }] },
  { type: "group" as const, label: "Outer", items: [{ value: "jupiter", label: "Jupiter" }, { value: "saturn", label: "Saturn" }] },
]
const countries = ["Austria", "Belgium", "Denmark", "France", "Germany", "Greece", "Ireland", "Italy", "Spain", "Sweden"]

export function SelectPage() {
  const [picked, setPicked] = useState<string[]>(["venus"])
  const [country, setCountry] = useState<string | null>(null)
  const [count, setCount] = useState(40)
  const long = Array.from({ length: count }, (_, i) => "Row " + (i + 1))
  return (
    <main id="page-select">
      <section id="basic">
        <SubmitForm id="s-form">
          <Select name="fruit" defaultValue="banana">
            <SelectLabel id="s-label">Fruit</SelectLabel>
            <SelectTrigger id="s-trigger">
              <SelectValueIcon id="s-value-icon" />
              <SelectValue id="s-value" placeholder="Pick a fruit" />
            </SelectTrigger>
            <SelectContent id="s-content" sideOffset={4}>
              <SelectGroup id="s-group">
                <SelectGroupLabel id="s-group-label">Sweet</SelectGroupLabel>
                <SelectItem id="s-apple" value="apple">
                  <SelectItemIcon id="s-apple-icon">A</SelectItemIcon>
                  Apple
                  <SelectItemIndicator id="s-apple-check">*</SelectItemIndicator>
                </SelectItem>
                <SelectItem id="s-banana" value="banana">
                  <SelectItemIcon>B</SelectItemIcon>
                  Banana
                </SelectItem>
                <SelectItem id="s-cherry" value="cherry" disabled>
                  Cherry
                </SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectItem id="s-lemon" value="lemon">
                Lemon
              </SelectItem>
              <SelectItem id="s-lime" value="lime">
                Lime
              </SelectItem>
            </SelectContent>
          </Select>
        </SubmitForm>
        <button id="s-after" type="button" style="position: absolute; top: 0; right: 0">
          After
        </button>
      </section>
      <section id="multiple">
        <SubmitForm id="m-form">
          <Select name="planet" multiple items={planets} value={picked} onValueChange={(next) => setPicked(next)} placeholder="Planets">
            <SelectTrigger id="m-trigger" aria-label="Planets" />
            <SelectClear id="m-clear">Clear</SelectClear>
          </Select>
          <output id="m-value">{picked.join(",")}</output>
          <button id="m-set" type="button" onClick={() => setPicked(["jupiter", "saturn"])}>
            Set from outside
          </button>
        </SubmitForm>
      </section>
      <section id="search">
        <Select value={country} onValueChange={(next) => setCountry(next)} multiple={false}>
          <SelectTrigger id="q-trigger" aria-label="Country">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent id="q-content">
            <SelectInput id="q-input" aria-label="Search countries" />
            <SelectList id="q-list">
              {countries.map((name) => (
                <SelectItem key={name} value={name} id={"q-" + name}>
                  <SelectItemText />
                </SelectItem>
              ))}
            </SelectList>
            <SelectEmpty id="q-empty">No country</SelectEmpty>
          </SelectContent>
        </Select>
        <output id="q-value">{country ?? "none"}</output>
      </section>
      <section id="all">
        <Select multiple defaultValue={[]} name="tag">
          <SelectTrigger id="a-trigger" aria-label="Tags" />
          <SelectContent id="a-content">
            <SelectSelectAll id="a-all">All</SelectSelectAll>
            <SelectItem id="a-red" value="red">
              Red
            </SelectItem>
            <SelectItem id="a-blue" value="blue">
              Blue
            </SelectItem>
          </SelectContent>
        </Select>
      </section>
      <section id="long">
        <Select defaultValue="Row 3">
          <SelectTrigger id="l-trigger" aria-label="Rows" />
          <SelectContent id="l-content" style="max-height: 150px; overflow: auto">
            {long.map((label) => (
              <SelectItem key={label} value={label} id={"l-" + label.split(" ")[1]}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button id="l-fewer" type="button" onClick={() => setCount(4)}>
          Fewer
        </button>
      </section>
      <section id="field">
        <Field name="size">
          <FieldLabel id="f-label">Size</FieldLabel>
          <Select>
            <SelectTrigger id="f-trigger" />
            <SelectContent>
              <SelectItem value="s">Small</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </section>
    </main>
  )
}
