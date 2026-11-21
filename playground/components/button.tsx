/** @jsxImportSource octane */
import { useState } from "octane"
import { Button } from "../../src/components/button"
import { SubmitForm } from "./form"

export function ButtonPage() {
  const [log, setLog] = useState<string[]>([])
  const [settle, setSettle] = useState<(() => void) | null>(null)
  return (
    <main id="page-button">
      <Button id="b" onClick={(event, details) => setLog((list) => [...list, event.type + ":" + details.source])}>
        Press
      </Button>
      <output id="b-log">{log.join(",")}</output>
      <Button
        id="slow"
        onClick={() =>
          new Promise<void>((resolve) => {
            setSettle(() => resolve)
          })
        }
      >
        Save
      </Button>
      <button id="slow-settle" type="button" onClick={() => settle?.()}>
        Settle
      </button>
      <Button id="off" disabled onClick={() => setLog((list) => [...list, "disabled"])}>
        Off
      </Button>
      <Button id="focusable-off" disabled focusableWhenDisabled>
        Focusable
      </Button>
      <Button id="link" render={<a href="#linked" />} onClick={() => setLog((list) => [...list, "link"])}>
        Link
      </Button>
      <Button id="div" render={<div />}>
        Div
      </Button>
      <SubmitForm id="b-form">
        <input name="q" defaultValue="x" />
        <Button id="b-submit" type="submit">
          Send
        </Button>
      </SubmitForm>
    </main>
  )
}
