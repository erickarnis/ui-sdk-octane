/** @jsxImportSource octane */
import { useState } from "octane"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  createConfirm,
} from "../../src/components/alert-dialog"

const ask = createConfirm()

export function AlertDialogPage() {
  const [result, setResult] = useState("none")
  const [answer, setAnswer] = useState("none")
  const [open, setOpen] = useState(false)
  return (
    <main id="page-alert-dialog">
      <section id="basic">
        <AlertDialog onOpenChange={(next, details) => !next && setResult(details.reason)}>
          <AlertDialogTrigger id="ad-trigger">Delete</AlertDialogTrigger>
          <AlertDialogBackdrop id="ad-backdrop" />
          <AlertDialogContent id="ad">
            <AlertDialogTitle id="ad-title">Delete this file?</AlertDialogTitle>
            <AlertDialogDescription id="ad-description">It can't be undone.</AlertDialogDescription>
            <AlertDialogClose id="ad-cancel">Cancel</AlertDialogClose>
            <AlertDialogClose id="ad-delete" value="delete">
              Delete
            </AlertDialogClose>
          </AlertDialogContent>
        </AlertDialog>
        <output id="ad-result">{result}</output>
      </section>
      <section id="controlled">
        <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
          <AlertDialogTrigger id="cad-trigger">Controlled</AlertDialogTrigger>
          <AlertDialogContent id="cad">
            <AlertDialogTitle>Leave?</AlertDialogTitle>
            <AlertDialogClose id="cad-close">Stay</AlertDialogClose>
          </AlertDialogContent>
        </AlertDialog>
        <output id="cad-open">{String(open)}</output>
      </section>
      <section id="confirm">
        <AlertDialog controller={ask.controller}>
          <AlertDialogContent id="q">
            <AlertDialogTitle id="q-title">Discard changes?</AlertDialogTitle>
            <AlertDialogClose id="q-no">Keep</AlertDialogClose>
            <AlertDialogClose id="q-yes" value="confirm">
              Discard
            </AlertDialogClose>
          </AlertDialogContent>
        </AlertDialog>
        <button
          id="q-ask"
          type="button"
          onClick={async () => setAnswer(String(await ask()))}
        >
          Ask
        </button>
        <output id="q-answer">{answer}</output>
      </section>
    </main>
  )
}
