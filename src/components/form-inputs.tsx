/** @jsxImportSource octane */
// Ported from @ui-sdk/react's form-inputs (Apache-2.0, 0.1.0-beta.13).
import type { Primitive } from "@ui-sdk/core"
import type { OctaneNode } from "octane"
import { readIn, slotIn } from "../internal.js"
import { usePart, type PrimitiveHandle } from "../primitive.js"
import type { Props } from "../render-element.js"

// A list root's handle: its state says whether it takes several values, and
// its api serializes them.
type ListHandle = PrimitiveHandle<Primitive> & {
  readonly state: { multiple?: boolean }
  readonly api: { internal: { serialized: () => string[] } }
}

// The hidden inputs that take part in a form for a list's root, like a
// select's: one for the value, or one more per value with `multiple`. Next to
// the root, outside it, so they take its handle.
function FormInputs({ handle }: { handle: ListHandle }): OctaneNode {
  // Core's values are typed `unknown`, so each element's props are a `Props`
  // bag, spread as they come.
  const inputs = ({ value, ...input }: Props) => {
    const textarea: Props = { ...input, defaultValue: value }
    // Read now: JSX reads a property only when Octane renders the element.
    const hiddenInputs =
      handle.state.multiple &&
      readIn(handle, () => handle.api.internal.serialized()).map((key) => {
        const { value: hiddenValue, ...hidden } = slotIn(
          handle,
          "value-input",
          { id: key, value: key },
        )
        const props: Props = { ...hidden, defaultValue: hiddenValue }
        return <input key={key} {...props} />
      })
    return (
      <>
        <textarea {...textarea} />
        {hiddenInputs}
      </>
    )
  }
  return usePart(handle, "form-input", {}, { render: inputs }, "textarea")
}

export { FormInputs }
