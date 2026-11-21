/** @jsxImportSource octane */
import { useState } from "octane"
import { confirm } from "../../src/components/alert-dialog"
import { OverlayHost } from "../../src/components/overlays"
import { toast } from "../../src/components/toast"

export function OverlaysPage() {
  const [answer, setAnswer] = useState("none")
  return (
    <main id="page-overlays">
      <button id="o-toast" type="button" onClick={() => toast({ title: "Hosted", duration: Infinity })}>
        Toast
      </button>
      <button
        id="o-confirm"
        type="button"
        onClick={async () =>
          setAnswer(
            String(
              await confirm({
                title: "Delete it?",
                description: "This can't be undone.",
                confirmLabel: "Delete",
              })
            )
          )
        }
      >
        Confirm
      </button>
      <output id="o-answer">{answer}</output>
      <OverlayHost toast={{ id: "o-region", side: "top" }} />
    </main>
  )
}
