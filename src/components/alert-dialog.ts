/** @jsxImportSource octane */
// Ported from @ui-sdk/react's alert-dialog (Apache-2.0, 0.1.0-beta.13).
// From its own module, so an app with only alert dialogs doesn't carry Dialog's presentation.
import { alertDialog as alertDialogPrimitive } from "@ui-sdk/core/alert-dialog"
import type {
  AlertDialogOptions,
  AlertDialogTriggerProps,
  dialog as dialogPrimitive,
  DialogOptions,
} from "@ui-sdk/core/dialog"
import { createElement, type OctaneNode } from "octane"
import { dialogParts, type TriggerPartProps } from "./dialog-parts.js"

// The alert dialog's slots and state are the dialog's. Only its options are narrower.
const alertParts = dialogParts(
  // SAFETY: core builds the alert dialog from the dialog's slots and state;
  // its type differs only in taking fewer options, which `AlertDialog` checks.
  alertDialogPrimitive as unknown as typeof dialogPrimitive,
  "AlertDialog"
)

/**
 * The props of `AlertDialog`.
 */
type AlertDialogProps = AlertDialogOptions & { children?: OctaneNode }

/**
 * A modal dialog that interrupts the user with something important and waits for an answer, like "Delete this
 * file?".
 */
function AlertDialog(props: AlertDialogProps): OctaneNode {
  // SAFETY: the parts run the alert dialog primitive, which passes its
  // callbacks only its own reasons, a subset of the dialog's.
  const options = props as DialogOptions & { children?: OctaneNode }
  return createElement(alertParts.Root, options)
}

/**
 * The button that opens the alert dialog. A trigger outside the alert dialog connects through `controller`.
 */
function AlertDialogTrigger(
  props: TriggerPartProps & Pick<AlertDialogTriggerProps, "controller">
): OctaneNode {
  return createElement(alertParts.Trigger, props)
}

/**
 * A dim behind the alert dialog. Pressing it does nothing.
 */
const AlertDialogBackdrop = alertParts.Backdrop

/**
 * The alert dialog itself, with the `alertdialog` role, named by its title. Put the title, the description
 * and the buttons that answer it inside.
 */
const AlertDialogContent = alertParts.Content

/**
 * The alert dialog's title, which names it. A level 2 heading by default.
 */
const AlertDialogTitle = alertParts.Title

/**
 * Describes the alert dialog while it's rendered. A paragraph by default.
 */
const AlertDialogDescription = alertParts.Description

/**
 * A button that closes the alert dialog, like Cancel or Delete. An `action` runs first, and a Promise it
 * returns keeps the alert dialog open until it settles.
 */
const AlertDialogClose = alertParts.Close

/**
 * Shows a trigger's shortcut inside the trigger.
 */
const AlertDialogShortcut = alertParts.Shortcut

export {
  confirm,
  createAlertDialogController,
  createConfirm,
} from "@ui-sdk/core/alert-dialog"
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
} from "@ui-sdk/core/alert-dialog"

export {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  type AlertDialogProps,
  AlertDialogShortcut,
  AlertDialogTitle,
  AlertDialogTrigger,
}
