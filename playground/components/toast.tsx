/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createToaster,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
  type ToastDismissDetails,
} from "../../src/components/toast"

const second = createToaster()

export function ToastPage() {
  const [log, setLog] = useState("none")
  return (
    <main id="page-toast">
      <button id="t-plain" type="button" onClick={() => toast("Saved", { duration: 600 })}>
        Plain
      </button>
      <button
        id="t-rich"
        type="button"
        onClick={() =>
          toast({
            id: "rich",
            title: <strong id="t-rich-title">File deleted</strong>,
            description: "It's in the bin.",
            duration: Infinity,
            action: { label: "Undo", onAction: () => setLog("undo") },
            cancel: { label: "Dismiss", onCancel: () => setLog("cancel") },
            onDismiss: (details: ToastDismissDetails) => setLog((last) => `${last}+dismiss:${details.reason}`),
          })
        }
      >
        Rich
      </button>
      <button id="t-second" type="button" onClick={() => second({ id: "custom", title: "Custom", duration: Infinity })}>
        Second
      </button>
      <output id="t-log">{log}</output>
      <ToastRegion id="t-region" aria-label="Notifications" />
      <ToastRegion id="t-region2" toaster={second} side="top" aria-label="Second">
        {(data) => (
          <Toast id={`t2-${data.id}`}>
            <ToastTitle id="t2-title" />
            <ToastDescription id="t2-description">Made by hand</ToastDescription>
            <ToastAction id="t2-action" onAction={() => setLog("custom-action")}>
              Go
            </ToastAction>
            <ToastClose id="t2-close">Close</ToastClose>
          </Toast>
        )}
      </ToastRegion>
    </main>
  )
}
