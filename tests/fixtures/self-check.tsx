/** @jsxImportSource octane */
// Not a test of the adapter: a page that differs between the two lanes on
// purpose, in each way the comparison is meant to notice.
import { useId } from "octane"
import { adapter, called } from "../app/harness"

called("who", adapter)

export default function Fixture() {
  const id = useId()
  return (
    <main>
      <p id="same" data-kept="yes">
        Same in both
      </p>
      <p id="attribute" data-who={adapter}>
        An attribute differs
      </p>
      <p id="words">Rendered by {adapter}</p>
      <div id="children">{adapter === "react" ? <i>only React</i> : <b>only Octane</b>}</div>
      <input id="field" defaultValue={adapter} aria-label="Field" />
      <button id="first" type="button">
        First
      </button>
      <label id="label" htmlFor={id}>
        Made ids read the same
      </label>
      <input id={id} aria-describedby={`${id}-hint missing`} />
    </main>
  )
}
