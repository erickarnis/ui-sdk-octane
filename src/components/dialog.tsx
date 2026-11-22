/** @jsxImportSource octane */
// Ported from @ui-sdk/react's dialog (Apache-2.0, 0.1.0-beta.13).
import {
  dialog as dialogPrimitive,
  type DialogOptions,
  type DialogTriggerProps,
} from "@ui-sdk/core/dialog"
import type { OctaneNode } from "octane"
import { dialogParts, type TriggerPartProps } from "./dialog-parts.js"
import { sheetViewport } from "./popup.js"

const parts = dialogParts(dialogPrimitive, "Dialog", sheetViewport)

/**
 * The props of `Dialog`.
 */
type DialogProps = DialogOptions & { children?: OctaneNode }

/**
 * A window over the page that asks for the user's attention. Put its trigger, backdrop and content inside.
 */
const Dialog = parts.Root

/**
 * The button that opens the dialog. A trigger outside the dialog, like one per table row, connects through
 * `controller`.
 */
function DialogTrigger(
  props: TriggerPartProps & Pick<DialogTriggerProps, "controller">
): OctaneNode {
  return <parts.Trigger {...props} />
}

/**
 * A dim behind the dialog. It's optional: without it, style the content's `::backdrop`.
 */
const DialogBackdrop = parts.Backdrop

/**
 * The dialog itself, named by its title and described by its description.
 */
const DialogContent = parts.Content

/**
 * The dialog's title, which names it. A level 2 heading by default.
 */
const DialogTitle = parts.Title

/**
 * Describes the dialog while it's rendered. A paragraph by default.
 */
const DialogDescription = parts.Description

/**
 * A button that closes the dialog. An `action` runs first, and a Promise it returns keeps the dialog open
 * until it settles.
 */
const DialogClose = parts.Close

/**
 * Shows a trigger's shortcut, like `⌘K`, inside the trigger. Hidden from screen readers, which hear `aria-keyshortcuts`.
 */
const DialogShortcut = parts.Shortcut

export { createDialogController } from "@ui-sdk/core/dialog"
export type {
  AlertDialogBackdropState,
  AlertDialogCloseActionDetails,
  AlertDialogCloseProps,
  AlertDialogCloseState,
  AlertDialogContentProps,
  AlertDialogContentState,
  AlertDialogController,
  AlertDialogOpenChangeReason,
  AlertDialogOptions,
  AlertDialogPayloadChangeReason,
  AlertDialogPrimitive,
  AlertDialogShortcutProps,
  AlertDialogShortcutState,
  AlertDialogTriggerProps,
  AlertDialogTriggerState,
  ConfirmEntry,
  ConfirmOptions,
  DialogApi,
  DialogBackdropState,
  DialogCloseActionDetails,
  DialogCloseProps,
  DialogCloseState,
  DialogContentProps,
  DialogContentState,
  DialogController,
  DialogDismissAttemptDetails,
  DialogDismissReason,
  DialogFinalFocus,
  DialogInitialFocus,
  DialogOpenChangeDetails,
  DialogOpenChangeReason,
  DialogOptions,
  DialogPayloadChangeReason,
  DialogPrimitive,
  DialogSharedOptions,
  DialogShortcutProps,
  DialogShortcutState,
  DialogTriggerProps,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  type DialogProps,
  DialogShortcut,
  DialogTitle,
  DialogTrigger,
}
