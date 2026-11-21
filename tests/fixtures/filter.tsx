/** @jsxImportSource octane */
// A slot's `input` handler and `direct` attributes: typing hides the items
// that don't match, without rendering them again.
import { createParts } from "../../src/primitive"
import { adapter, called, rendered } from "../app/harness"
import { filterList } from "./primitives"

const Filter = createParts(filterList, { root: "div", input: "input", item: "li" })

const fruits = ["Apple", "Pear", "Plum"]

// The one prop the two adapters name differently: core's `input` handler is
// onInput in Octane, which has no synthetic onChange, and onChange in React.
// The app's handler merges with the part's under the same name.
const onType = (handler: (event: Event) => void) =>
  adapter === "react" ? { onChange: handler } : { onInput: handler }

export default function Fixture() {
  return (
    <main>
      <Filter.Root id="plain">
        <Filter.Input
          aria-label="Filter"
          {...onType((event) => {
            if (event.target instanceof HTMLInputElement) called("the app heard", event.target.value)
          })}
        />
        <ul>
          {fruits.map((fruit) => (
            <Filter.Item key={fruit} value={fruit}>
              {() => {
                rendered(fruit)
                return fruit
              }}
            </Filter.Item>
          ))}
        </ul>
      </Filter.Root>

      <Filter.Root id="prevented">
        <Filter.Input
          aria-label="Filter that the app stops"
          {...onType((event) => {
            called("the app prevented")
            event.preventDefault()
          })}
        />
        <ul>
          {fruits.map((fruit) => (
            <Filter.Item key={fruit} value={fruit}>
              {fruit}
            </Filter.Item>
          ))}
        </ul>
      </Filter.Root>
    </main>
  )
}
