/** @jsxImportSource octane */
// Roving focus with typeahead, and parts nested in an item: a label and a
// check that take the item's `value` when theirs is left out.
import { useState } from "octane"
import { createParts } from "../../src/primitive"
import { called } from "../app/harness"
import { picker } from "./primitives"

const Picker = createParts(picker, {
  root: "ul",
  item: "li",
  "item-label": "span",
  "item-check": "span",
})

const all = ["apple", "pear", "plum", "peach"]

export default function Fixture() {
  const [fruits, setFruits] = useState(all.slice(0, 3))
  return (
    <main>
      <Picker.Root
        id="fruits"
        aria-label="Fruit"
        defaultValue="pear"
        onValueChange={(value, details) => called("onValueChange", value, details.reason)}
      >
        {fruits.map((fruit) => (
          <Picker.Item key={fruit} value={fruit}>
            <Picker.ItemCheck>✓ </Picker.ItemCheck>
            <Picker.ItemLabel>{fruit}</Picker.ItemLabel>
          </Picker.Item>
        ))}
      </Picker.Root>

      <section aria-label="the app">
        <button id="add" type="button" onClick={() => setFruits(all)}>
          Add peach
        </button>
        <button id="sort" type="button" onClick={() => setFruits([...fruits].sort().reverse())}>
          Sort backwards
        </button>
        <button id="drop" type="button" onClick={() => setFruits(fruits.filter((fruit) => fruit !== "pear"))}>
          Drop pear
        </button>
      </section>

      <Picker.Root id="explicit" aria-label="Explicit values" defaultValue="plum">
        <Picker.Item value="apple">
          {/* A value written on the nested part wins over the item's. */}
          <Picker.ItemLabel value="plum">Labelled for plum inside apple</Picker.ItemLabel>
          <Picker.ItemCheck value="plum">✓</Picker.ItemCheck>
        </Picker.Item>
      </Picker.Root>
    </main>
  )
}
