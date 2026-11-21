/** @jsxImportSource octane */
// Ported from @ui-sdk/react's overlays (Apache-2.0, 0.1.0-beta.13). Where
// upstream asserts the type of an entry's data, this checks it.
import type { ConfirmEntry, ConfirmOptions } from "@ui-sdk/core/dialog"
import {
  overlays as sharedOverlays,
  type OverlayEntry,
  type Overlays,
} from "@ui-sdk/core/overlays"
import { toasterInternals, type Toaster } from "@ui-sdk/core/renderer"
import {
  createElement,
  Fragment,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type OctaneNode,
} from "octane"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./alert-dialog.js"
import { Region, type ToastRegionProps } from "./toast-parts.js"

const noEntries: readonly OverlayEntry[] = []

const hasFunction = (value: object, key: string) =>
  key in value && typeof Reflect.get(value, key) === "function"

// A toaster entry's data, as core's toaster opens it.
function isToasterData(data: unknown): data is { toaster: Toaster } {
  if (typeof data !== "object" || data === null || !("toaster" in data))
    return false
  const toaster = data.toaster
  return typeof toaster === "function" && hasFunction(toaster, "subscribe")
}

// A confirm entry's data, as core's `confirm()` opens it.
function isConfirmEntry(data: unknown): data is ConfirmEntry {
  return (
    typeof data === "object" &&
    data !== null &&
    "controller" in data &&
    hasFunction(data, "open") &&
    hasFunction(data, "done")
  )
}

/**
 * Props for `OverlayHost`.
 */
type OverlayHostProps = {
  /**
   * The registry it renders.
   * @defaultValue the shared `overlays`, which `toast()` and `confirm()` open into
   */
  overlays?: Overlays
  /** Props for the toast regions it renders, like `side`, `className` and `children`. */
  toast?: Omit<ToastRegionProps, "toaster">
}

/**
 * Renders what `toast()` and `confirm()` open, from anywhere in the app.
 * Mount it once, near the root. A `ToastRegion` you place yourself takes over
 * its toaster.
 */
function OverlayHost({
  overlays = sharedOverlays,
  toast,
}: OverlayHostProps): OctaneNode {
  const entries = useSyncExternalStore(
    overlays.subscribe,
    overlays.entries,
    () => noEntries
  )
  useLayoutEffect(() => overlays.attachHost(), [overlays])
  return entries.map((entry) => {
    // Keyed on a fragment, as the hosted parts take no element props.
    if (entry.type === "toaster" && isToasterData(entry.data))
      return createElement(
        Fragment,
        { key: entry.id },
        createElement(HostedToaster, {
          toaster: entry.data.toaster,
          props: toast,
        })
      )
    if (entry.type === "confirm" && isConfirmEntry(entry.data))
      return createElement(
        Fragment,
        { key: entry.id },
        createElement(HostedConfirm, { entry: entry.data })
      )
    return null
  })
}

function HostedToaster({
  toaster,
  props,
}: {
  toaster: Toaster
  props?: Omit<ToastRegionProps, "toaster"> | undefined
}) {
  const placed = useSyncExternalStore(
    toaster.subscribe,
    () => toasterInternals(toaster).hasPlacedRegion(),
    () => false
  )
  if (placed) return null
  return createElement(Region, { ...props, toaster, placed: false })
}

function HostedConfirm({ entry }: { entry: ConfirmEntry }) {
  // The alert dialog attached the controller in its layout effect, so it can open now.
  useEffect(() => {
    entry.open()
  }, [entry])
  const question: Partial<ConfirmOptions> = entry.payload ?? {}
  return createElement(
    AlertDialog,
    {
      controller: entry.controller,
      onOpenChangeComplete: (open: boolean) => {
        if (!open) entry.done()
      },
    },
    createElement(
      AlertDialogContent,
      null,
      createElement(AlertDialogTitle, null, question.title),
      question.description
        ? createElement(AlertDialogDescription, null, question.description)
        : null,
      createElement(
        "div",
        null,
        createElement(AlertDialogClose, null, question.cancelLabel ?? "Cancel"),
        createElement(
          AlertDialogClose,
          { value: "confirm" },
          question.confirmLabel ?? "Continue"
        )
      )
    )
  )
}

export { createOverlays, overlays } from "@ui-sdk/core/overlays"
export type { OverlayEntry, Overlays } from "@ui-sdk/core/overlays"

export { OverlayHost, type OverlayHostProps }
