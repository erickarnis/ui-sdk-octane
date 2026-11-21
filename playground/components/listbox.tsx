/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import {
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
  ListboxSeparator,
} from "../../src/components/listbox"
import { SubmitForm } from "./form"

const planets = [
  { type: "group" as const, label: "Inner", items: [{ value: "mercury", label: "Mercury" }, { value: "venus", label: "Venus" }] },
  { type: "separator" as const },
  { type: "group" as const, label: "Outer", items: [{ value: "jupiter", label: "Jupiter" }, { value: "saturn", label: "Saturn", disabled: true }, { value: "neptune", label: "Neptune" }] },
]

type Fruit = { id: number; name: string }
const fruits: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
]

export function ListboxPage() {
  const [picked, setPicked] = useState<string[]>(["venus"])
  const [fruit, setFruit] = useState<Fruit | null>(null)
  const [count, setCount] = useState(30)
  const long = Array.from({ length: count }, (_, i) => "Item " + (i + 1))
  return (
    <main id="page-listbox">
      <section id="single">
        <SubmitForm id="lb-form">
          <span id="lb-label">Colour</span>
          <Listbox id="lb" name="colour" aria-labelledby="lb-label" defaultValue="green">
            <ListboxGroup id="lb-warm">
              <ListboxGroupLabel id="lb-warm-label">Warm</ListboxGroupLabel>
              <ListboxItem id="lb-red" value="red">
                Red
                <ListboxItemIndicator id="lb-red-check">*</ListboxItemIndicator>
              </ListboxItem>
              <ListboxItem id="lb-orange" value="orange" disabled>
                Orange
              </ListboxItem>
            </ListboxGroup>
            <ListboxSeparator id="lb-sep" />
            <ListboxItem id="lb-green" value="green">
              Green
            </ListboxItem>
            <ListboxItem id="lb-blue" value="blue">
              Blue
            </ListboxItem>
            <ListboxItem id="lb-black" value="black">
              Black
            </ListboxItem>
          </Listbox>
        </SubmitForm>
      </section>
      <section id="multiple">
        <SubmitForm id="mlb-form">
          <Listbox id="mlb" aria-label="Planets" name="planet" multiple items={planets} value={picked} onValueChange={(next) => setPicked(next)} />
          <output id="mlb-value">{picked.join(",")}</output>
          <button id="mlb-set" type="button" onClick={() => setPicked(["jupiter", "mercury"])}>
            Set from outside
          </button>
        </SubmitForm>
      </section>
      <section id="objects">
        <Listbox
          id="olb"
          aria-label="Fruit"
          value={fruit}
          onValueChange={(next) => setFruit(next)}
          isItemEqualToValue={(a, b) => a.id === b.id}
          itemToValue={(item) => String(item.id)}
        >
          {fruits.map((item) => (
            <ListboxItem key={item.id} id={"olb-" + item.id} value={item} label={item.name}>
              {item.name}
            </ListboxItem>
          ))}
        </Listbox>
        <output id="olb-value">{fruit ? fruit.name : "none"}</output>
      </section>
      <section id="long">
        <Listbox id="llb" aria-label="Long" style="max-height: 120px; overflow: auto">
          {long.map((label) => (
            <ListboxItem key={label} id={"llb-" + label.split(" ")[1]} value={label}>
              {label}
            </ListboxItem>
          ))}
        </Listbox>
        <button id="llb-fewer" type="button" onClick={() => setCount(5)}>
          Fewer
        </button>
      </section>
      <section id="field">
        <Field name="size">
          <FieldLabel id="flb-label">Size</FieldLabel>
          <Listbox id="flb">
            <ListboxItem id="flb-s" value="s">
              Small
            </ListboxItem>
            <ListboxItem id="flb-l" value="l">
              Large
            </ListboxItem>
          </Listbox>
        </Field>
      </section>
    </main>
  )
}
