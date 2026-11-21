/** @jsxImportSource octane */
// A form around a page's controls that shows what it would submit.
import { useState, type OctaneNode } from "octane"

export function SubmitForm({ id, children }: { id: string; children?: OctaneNode }) {
  const [sent, setSent] = useState("")
  return (
    <form
      id={id}
      onSubmit={(event: SubmitEvent) => {
        event.preventDefault()
        const form = event.currentTarget
        if (!(form instanceof HTMLFormElement)) return
        const pairs = [...new FormData(form)].map(([name, value]) => `${name}=${String(value)}`)
        setSent(pairs.join("&") || "(empty)")
      }}
    >
      {children}
      <button id={id + "-submit"} type="submit">
        Submit
      </button>
      <button id={id + "-reset"} type="reset">
        Reset
      </button>
      <output id={id + "-sent"}>{sent}</output>
    </form>
  )
}
